/**
* Meadow MongoDB Provider Fable Service
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');

const { MongoClient } = require('mongodb');

const libMeadowSchemaMongoDB = require('./Meadow-Schema-MongoDB.js');

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

		// Schema provider handles DDL operations (create, drop, index, etc.)
		this._SchemaProvider = new libMeadowSchemaMongoDB(this.fable, this.options, `${this.Hash}-Schema`);

		if (this.options.MeadowConnectionMongoDBAutoConnect)
		{
			this.connect();
		}
	}

	get schemaProvider()
	{
		return this._SchemaProvider;
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
		return this._SchemaProvider.generateDropTableStatement(pTableName);
	}

	generateCreateTableStatement(pMeadowTableSchema)
	{
		return this._SchemaProvider.generateCreateTableStatement(pMeadowTableSchema);
	}

	createTables(pMeadowSchema, fCallback)
	{
		return this._SchemaProvider.createTables(pMeadowSchema, fCallback);
	}

	createTable(pMeadowTableSchema, fCallback)
	{
		return this._SchemaProvider.createTable(pMeadowTableSchema, fCallback);
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
		this._SchemaProvider.setDatabase(this._Database);
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
