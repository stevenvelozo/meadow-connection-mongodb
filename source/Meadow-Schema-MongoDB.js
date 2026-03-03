/**
* Meadow MongoDB Schema Provider
*
* Handles collection creation, dropping, and schema generation for MongoDB.
* Separated from the connection provider to allow independent extension
* for indexing and other schema operations.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');

class MeadowSchemaMongoDB extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowSchemaMongoDB';

		// Reference to the MongoDB database instance, set by the connection provider
		this._Database = false;
	}

	/**
	 * Set the database reference for executing schema operations.
	 * @param {object} pDatabase - MongoDB Db instance
	 * @returns {MeadowSchemaMongoDB} this (for chaining)
	 */
	setDatabase(pDatabase)
	{
		this._Database = pDatabase;
		return this;
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
}

module.exports = MeadowSchemaMongoDB;
