/**
* Meadow MongoDB Provider Fable Service
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');

const { MongoClient } = require('mongodb');

class MeadowConnectionMongoDB extends libFableServiceProviderBase
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.serviceType = 'MeadowConnectionMongoDB';

		// See if the user passed in a MongoDB object already
		if (typeof(this.options.MongoDB) == 'object')
		{
			// Support Meadow-style property names
			if (!this.options.MongoDB.hasOwnProperty('host') && this.options.MongoDB.hasOwnProperty('Server'))
			{
				this.options.MongoDB.host = this.options.MongoDB.Server;
			}
			if (!this.options.MongoDB.hasOwnProperty('port') && this.options.MongoDB.hasOwnProperty('Port'))
			{
				this.options.MongoDB.port = this.options.MongoDB.Port;
			}
			if (!this.options.MongoDB.hasOwnProperty('user') && this.options.MongoDB.hasOwnProperty('User'))
			{
				this.options.MongoDB.user = this.options.MongoDB.User;
			}
			if (!this.options.MongoDB.hasOwnProperty('password') && this.options.MongoDB.hasOwnProperty('Password'))
			{
				this.options.MongoDB.password = this.options.MongoDB.Password;
			}
			if (!this.options.MongoDB.hasOwnProperty('database') && this.options.MongoDB.hasOwnProperty('Database'))
			{
				this.options.MongoDB.database = this.options.MongoDB.Database;
			}
			if (!this.options.MongoDB.hasOwnProperty('maxPoolSize') && this.options.MongoDB.hasOwnProperty('ConnectionPoolLimit'))
			{
				this.options.MongoDB.maxPoolSize = this.options.MongoDB.ConnectionPoolLimit;
			}
		}
		else if (typeof(this.fable.settings.MongoDB) == 'object')
		{
			this.options.MongoDB = (
				{
					host: this.fable.settings.MongoDB.Server || '127.0.0.1',
					port: this.fable.settings.MongoDB.Port || 27017,
					user: this.fable.settings.MongoDB.User || '',
					password: this.fable.settings.MongoDB.Password || '',
					database: this.fable.settings.MongoDB.Database || 'test',
					maxPoolSize: this.fable.settings.MongoDB.ConnectionPoolLimit || 10
				});
		}

		if (!this.options.MeadowConnectionMongoDBAutoConnect)
		{
			this.options.MeadowConnectionMongoDBAutoConnect = this.fable.settings.MeadowConnectionMongoDBAutoConnect;
		}

		this.serviceType = 'MeadowConnectionMongoDB';
		this._Client = false;
		this._Database = false;
		this.connected = false;

		if (this.options.MeadowConnectionMongoDBAutoConnect)
		{
			this.connect();
		}
	}

	/**
	* Build the MongoDB connection URI from options.
	*/
	_buildConnectionURI()
	{
		let tmpOptions = this.options.MongoDB || {};
		let tmpHost = tmpOptions.host || '127.0.0.1';
		let tmpPort = tmpOptions.port || 27017;
		let tmpUser = tmpOptions.user || '';
		let tmpPassword = tmpOptions.password || '';
		let tmpDatabase = tmpOptions.database || 'test';

		if (tmpUser && tmpPassword)
		{
			return `mongodb://${encodeURIComponent(tmpUser)}:${encodeURIComponent(tmpPassword)}@${tmpHost}:${tmpPort}/${tmpDatabase}`;
		}
		else
		{
			return `mongodb://${tmpHost}:${tmpPort}/${tmpDatabase}`;
		}
	}

	generateDropTableStatement(pTableName)
	{
		// Returns a descriptor; the actual drop uses the MongoDB driver
		return { operation: 'drop', collection: pTableName };
	}

	generateCreateTableStatement(pMeadowTableSchema)
	{
		this.log.info(`--> Building the collection creation descriptor for ${pMeadowTableSchema.TableName} ...`);

		let tmpDescriptor = {
			operation: 'createCollection',
			collection: pMeadowTableSchema.TableName,
			indexes: []
		};

		for (let j = 0; j < pMeadowTableSchema.Columns.length; j++)
		{
			let tmpColumn = pMeadowTableSchema.Columns[j];

			switch (tmpColumn.DataType)
			{
				case 'ID':
					// AutoIdentity field gets a unique ascending index
					tmpDescriptor.indexes.push(
					{
						key: { [tmpColumn.Column]: 1 },
						unique: true,
						name: `idx_${tmpColumn.Column}_unique`
					});
					break;
				case 'GUID':
					// GUID field gets a unique index
					tmpDescriptor.indexes.push(
					{
						key: { [tmpColumn.Column]: 1 },
						unique: true,
						name: `idx_${tmpColumn.Column}_unique`
					});
					break;
				case 'ForeignKey':
					// Foreign key gets an index for lookups
					tmpDescriptor.indexes.push(
					{
						key: { [tmpColumn.Column]: 1 },
						name: `idx_${tmpColumn.Column}`
					});
					break;
				default:
					break;
			}
		}

		return tmpDescriptor;
	}

	createTables(pMeadowSchema, fCallback)
	{
		this.fable.Utility.eachLimit(pMeadowSchema.Tables, 1,
			(pTable, fCreateComplete) =>
			{
				return this.createTable(pTable, fCreateComplete);
			},
			(pCreateError) =>
			{
				if (pCreateError)
				{
					this.log.error(`Meadow-MongoDB Error creating collections from Schema: ${pCreateError}`, pCreateError);
				}
				this.log.info('Done creating collections!');
				return fCallback(pCreateError);
			});
	}

	createTable(pMeadowTableSchema, fCallback)
	{
		let tmpDescriptor = this.generateCreateTableStatement(pMeadowTableSchema);

		if (!this._Database)
		{
			this.log.error(`Meadow-MongoDB CREATE COLLECTION ${tmpDescriptor.collection} failed: not connected.`);
			return fCallback(new Error('Not connected to MongoDB'));
		}

		// Create collection (ignore error if it already exists)
		this._Database.createCollection(tmpDescriptor.collection)
			.then(() =>
			{
				this.log.info(`Meadow-MongoDB collection ${tmpDescriptor.collection} created or already exists.`);

				// Create indexes if any
				if (tmpDescriptor.indexes.length > 0)
				{
					let tmpCollection = this._Database.collection(tmpDescriptor.collection);
					return tmpCollection.createIndexes(tmpDescriptor.indexes);
				}
			})
			.then(() =>
			{
				this.log.info(`Meadow-MongoDB indexes for ${tmpDescriptor.collection} created successfully.`);
				return fCallback();
			})
			.catch((pError) =>
			{
				// 48 = NamespaceExists (collection already exists)
				if (pError.code === 48)
				{
					this.log.warn(`Meadow-MongoDB collection ${tmpDescriptor.collection} already existed.`);

					// Still try to create indexes
					if (tmpDescriptor.indexes.length > 0)
					{
						let tmpCollection = this._Database.collection(tmpDescriptor.collection);
						tmpCollection.createIndexes(tmpDescriptor.indexes)
							.then(() => fCallback())
							.catch((pIndexError) =>
							{
								this.log.warn(`Meadow-MongoDB index creation for ${tmpDescriptor.collection}: ${pIndexError.message}`);
								return fCallback();
							});
					}
					else
					{
						return fCallback();
					}
				}
				else
				{
					this.log.error(`Meadow-MongoDB CREATE COLLECTION ${tmpDescriptor.collection} failed!`, pError);
					return fCallback(pError);
				}
			});
	}

	connect()
	{
		if (this._Client)
		{
			let tmpCleansedSettings = JSON.parse(JSON.stringify(this.options.MongoDB || {}));
			tmpCleansedSettings.password = '*****************';
			this.log.error(`Meadow-Connection-MongoDB trying to connect but is already connected - skipping.`, tmpCleansedSettings);
			return;
		}

		let tmpURI = this._buildConnectionURI();
		let tmpOptions = {
			maxPoolSize: (this.options.MongoDB && this.options.MongoDB.maxPoolSize) || 10
		};

		this.fable.log.info(`Meadow-Connection-MongoDB connecting to [${this.options.MongoDB.host}:${this.options.MongoDB.port}] for database ${this.options.MongoDB.database} with pool size ${tmpOptions.maxPoolSize}`);

		this._Client = new MongoClient(tmpURI, tmpOptions);
		this._Database = this._Client.db(this.options.MongoDB.database);
		this.connected = true;
	}

	connectAsync(fCallback)
	{
		let tmpCallback = fCallback;
		if (typeof (tmpCallback) !== 'function')
		{
			this.log.error(`Meadow MongoDB connectAsync() called without a callback.`);
			tmpCallback = () => { };
		}

		try
		{
			if (this._Client)
			{
				return tmpCallback(null, this._Database);
			}
			else
			{
				this.connect();
				return tmpCallback(null, this._Database);
			}
		}
		catch(pError)
		{
			this.log.error(`Meadow MongoDB connectAsync() error: ${pError}`, pError);
			return tmpCallback(pError);
		}
	}

	/**
	* Returns the MongoDB Db instance (analogous to pool in SQL drivers).
	*/
	get pool()
	{
		return this._Database;
	}

	/**
	* Returns the raw MongoClient instance.
	*/
	get client()
	{
		return this._Client;
	}
}

module.exports = MeadowConnectionMongoDB;
