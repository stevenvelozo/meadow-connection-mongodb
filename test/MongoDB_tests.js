/**
* Unit tests for Meadow Connection MongoDB
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

const Chai = require('chai');
const Expect = Chai.expect;

const libFable = require('fable');
const libMeadowConnectionMongoDB = require('../source/Meadow-Connection-MongoDB.js');

const _FableConfig = (
	{
		"Product": "MeadowMongoDBTest",
		"ProductVersion": "1.0.0",

		"UUID":
			{
				"DataCenter": 0,
				"Worker": 0
			},
		"LogStreams":
			[
				{
					"streamtype": "console"
				}
			],

		"MongoDB":
			{
				"Server": "127.0.0.1",
				"Port": 27117,
				"User": "",
				"Password": "",
				"Database": "meadow_conn_test",
				"ConnectionPoolLimit": 20
			}
	});

const _AnimalSchema = {
	TableName: 'Animal',
	Columns: [
		{ Column: 'IDAnimal', DataType: 'ID' },
		{ Column: 'GUIDAnimal', DataType: 'GUID', Size: 36 },
		{ Column: 'Name', DataType: 'String', Size: 128 },
		{ Column: 'Age', DataType: 'Numeric' },
		{ Column: 'Cost', DataType: 'Decimal', Size: '10,2' },
		{ Column: 'Description', DataType: 'Text' },
		{ Column: 'Birthday', DataType: 'DateTime' },
		{ Column: 'Active', DataType: 'Boolean' },
		{ Column: 'IDFarm', DataType: 'ForeignKey' }
	]
};

const _VehicleSchema = {
	TableName: 'Vehicle',
	Columns: [
		{ Column: 'IDVehicle', DataType: 'ID' },
		{ Column: 'GUIDVehicle', DataType: 'GUID', Size: 36 },
		{ Column: 'Make', DataType: 'String', Size: 64 },
		{ Column: 'Model', DataType: 'String', Size: 64 },
		{ Column: 'Year', DataType: 'Numeric' }
	]
};

suite
(
	'Meadow-Connection-MongoDB',
	() =>
	{
		setup(() => {});

		suite
		(
			'Object Sanity',
			() =>
			{
				test
				(
					'constructor should create a connection service',
					() =>
					{
						let _Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						Expect(_Fable.MeadowMongoDBProvider).to.be.an('object');
						Expect(_Fable.MeadowMongoDBProvider.serviceType).to.equal('MeadowConnectionMongoDB');
						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(false);
					}
				);
				test
				(
					'pass in your own settings',
					() =>
					{
						let _Fable = new libFable();
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider', {MongoDB: _FableConfig.MongoDB});

						Expect(_Fable.MeadowMongoDBProvider).to.be.an('object');
						Expect(_Fable.MeadowMongoDBProvider.serviceType).to.equal('MeadowConnectionMongoDB');
						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(false);
					}
				);
			}
		);
		suite
		(
			'DDL Generation',
			() =>
			{
				test
				(
					'generateCreateTableStatement produces a valid MongoDB collection descriptor',
					() =>
					{
						let _Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						let tmpResult = _Fable.MeadowMongoDBProvider.generateCreateTableStatement(_AnimalSchema);
						Expect(tmpResult.operation).to.equal('createCollection');
						Expect(tmpResult.collection).to.equal('Animal');
						Expect(tmpResult.indexes).to.be.an('array');
						// ID, GUID, and ForeignKey should each create an index
						Expect(tmpResult.indexes.length).to.equal(3);
						// First index should be IDAnimal (unique)
						Expect(tmpResult.indexes[0].key.IDAnimal).to.equal(1);
						Expect(tmpResult.indexes[0].unique).to.equal(true);
						// Second index should be GUIDAnimal (unique)
						Expect(tmpResult.indexes[1].key.GUIDAnimal).to.equal(1);
						Expect(tmpResult.indexes[1].unique).to.equal(true);
						// Third index should be IDFarm (not unique)
						Expect(tmpResult.indexes[2].key.IDFarm).to.equal(1);
						Expect(tmpResult.indexes[2]).to.not.have.property('unique');
					}
				);
				test
				(
					'generateDropTableStatement produces a valid MongoDB drop descriptor',
					() =>
					{
						let _Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						let tmpResult = _Fable.MeadowMongoDBProvider.generateDropTableStatement('Animal');
						Expect(tmpResult.operation).to.equal('drop');
						Expect(tmpResult.collection).to.equal('Animal');
					}
				);
				test
				(
					'connection URI is built correctly without auth',
					() =>
					{
						let _Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						let tmpURI = _Fable.MeadowMongoDBProvider._buildConnectionURI();
						Expect(tmpURI).to.equal('mongodb://127.0.0.1:27117/meadow_conn_test');
					}
				);
				test
				(
					'connection URI is built correctly with auth',
					() =>
					{
						let _Fable = new libFable();
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider',
						{
							MongoDB:
							{
								Server: 'myhost',
								Port: 27018,
								User: 'admin',
								Password: 'secret',
								Database: 'mydb'
							}
						});

						let tmpURI = _Fable.MeadowMongoDBProvider._buildConnectionURI();
						Expect(tmpURI).to.equal('mongodb://admin:secret@myhost:27018/mydb');
					}
				);
			}
		);
		suite
		(
			'Connection',
			() =>
			{
				test
				(
					'connect with default fable.settings',
					(fDone) =>
					{
						let _Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(false);

						_Fable.MeadowMongoDBProvider.connect();

						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(true);
						Expect(_Fable.MeadowMongoDBProvider.pool).to.be.an('object');

						// Verify we can actually communicate with MongoDB
						_Fable.MeadowMongoDBProvider.pool.admin().ping()
							.then((pResult) =>
							{
								Expect(pResult).to.have.property('ok');
								Expect(pResult.ok).to.equal(1);
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone();
							})
							.catch((pError) =>
							{
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone(pError);
							});
					}
				);
				test
				(
					'connectAsync callback',
					(fDone) =>
					{
						let _Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						_Fable.MeadowMongoDBProvider.connectAsync(
							(pError, pDatabase) =>
							{
								Expect(pError).to.equal(null);
								Expect(pDatabase).to.be.an('object');
								Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(true);
								Expect(_Fable.MeadowMongoDBProvider.pool).to.equal(pDatabase);

								_Fable.MeadowMongoDBProvider.client.close();
								return fDone();
							});
					}
				);
				test
				(
					'autoconnect via MeadowConnectionMongoDBAutoConnect',
					(fDone) =>
					{
						let tmpConfig = JSON.parse(JSON.stringify(_FableConfig));
						tmpConfig.MeadowConnectionMongoDBAutoConnect = true;

						let _Fable = new libFable(tmpConfig);
						_Fable.serviceManager.addAndInstantiateServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);

						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(true);
						Expect(_Fable.MeadowMongoDBProvider.pool).to.be.an('object');

						_Fable.MeadowMongoDBProvider.pool.admin().ping()
							.then((pResult) =>
							{
								Expect(pResult.ok).to.equal(1);
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone();
							})
							.catch((pError) =>
							{
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone(pError);
							});
					}
				);
				test
				(
					'connect when already connected logs error and does not throw',
					(fDone) =>
					{
						let _Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						_Fable.MeadowMongoDBProvider.connect();
						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(true);

						// Second connect should not throw
						_Fable.MeadowMongoDBProvider.connect();
						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(true);

						_Fable.MeadowMongoDBProvider.client.close();
						return fDone();
					}
				);
				test
				(
					'pass in your own settings and connect',
					(fDone) =>
					{
						let _Fable = new libFable();
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider', {MongoDB: _FableConfig.MongoDB});

						_Fable.MeadowMongoDBProvider.connect();

						Expect(_Fable.MeadowMongoDBProvider.connected).to.equal(true);

						_Fable.MeadowMongoDBProvider.pool.admin().ping()
							.then((pResult) =>
							{
								Expect(pResult.ok).to.equal(1);
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone();
							})
							.catch((pError) =>
							{
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone(pError);
							});
					}
				);
			}
		);
		suite
		(
			'Collection & Index Creation',
			() =>
			{
				let _Fable = null;

				suiteSetup
				(
					(fDone) =>
					{
						_Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');
						_Fable.MeadowMongoDBProvider.connect();

						// Drop any leftover test collections
						let tmpDb = _Fable.MeadowMongoDBProvider.pool;
						Promise.all([
							tmpDb.collection('Animal').drop().catch(() => {}),
							tmpDb.collection('Vehicle').drop().catch(() => {})
						])
						.then(() => fDone())
						.catch(() => fDone());
					}
				);

				suiteTeardown
				(
					(fDone) =>
					{
						let tmpDb = _Fable.MeadowMongoDBProvider.pool;
						Promise.all([
							tmpDb.collection('Animal').drop().catch(() => {}),
							tmpDb.collection('Vehicle').drop().catch(() => {})
						])
						.then(() =>
						{
							_Fable.MeadowMongoDBProvider.client.close();
							fDone();
						})
						.catch(() =>
						{
							_Fable.MeadowMongoDBProvider.client.close();
							fDone();
						});
					}
				);

				test
				(
					'createTable creates collection and indexes',
					(fDone) =>
					{
						_Fable.MeadowMongoDBProvider.createTable(_AnimalSchema,
							(pError) =>
							{
								Expect(pError).to.not.be.an('error');

								let tmpDb = _Fable.MeadowMongoDBProvider.pool;

								// Verify collection exists
								tmpDb.listCollections({ name: 'Animal' }).toArray()
									.then((pCollections) =>
									{
										Expect(pCollections.length).to.equal(1);
										Expect(pCollections[0].name).to.equal('Animal');

										// Verify indexes were created
										return tmpDb.collection('Animal').indexes();
									})
									.then((pIndexes) =>
									{
										// _id (default) + IDAnimal + GUIDAnimal + IDFarm = 4
										Expect(pIndexes.length).to.equal(4);

										// Find our custom indexes
										let tmpIdAnimalIdx = pIndexes.find((pIdx) => pIdx.name === 'idx_IDAnimal_unique');
										Expect(tmpIdAnimalIdx).to.be.an('object');
										Expect(tmpIdAnimalIdx.unique).to.equal(true);

										let tmpGuidIdx = pIndexes.find((pIdx) => pIdx.name === 'idx_GUIDAnimal_unique');
										Expect(tmpGuidIdx).to.be.an('object');
										Expect(tmpGuidIdx.unique).to.equal(true);

										let tmpForeignKeyIdx = pIndexes.find((pIdx) => pIdx.name === 'idx_IDFarm');
										Expect(tmpForeignKeyIdx).to.be.an('object');

										return fDone();
									})
									.catch((pError) => fDone(pError));
							});
					}
				);
				test
				(
					'createTable is idempotent',
					(fDone) =>
					{
						// Call createTable again for the same schema — should not error
						_Fable.MeadowMongoDBProvider.createTable(_AnimalSchema,
							(pError) =>
							{
								Expect(pError).to.not.be.an('error');
								return fDone();
							});
					}
				);
				test
				(
					'createTables creates multiple collections',
					(fDone) =>
					{
						let tmpMultiSchema = {
							Tables: [_AnimalSchema, _VehicleSchema]
						};

						_Fable.MeadowMongoDBProvider.createTables(tmpMultiSchema,
							(pError) =>
							{
								Expect(pError).to.not.be.an('error');

								let tmpDb = _Fable.MeadowMongoDBProvider.pool;
								tmpDb.listCollections().toArray()
									.then((pCollections) =>
									{
										let tmpNames = pCollections.map((pC) => pC.name);
										Expect(tmpNames).to.include('Animal');
										Expect(tmpNames).to.include('Vehicle');
										return fDone();
									})
									.catch((pError) => fDone(pError));
							});
					}
				);
				test
				(
					'createTable when not connected returns error',
					(fDone) =>
					{
						// Create a disconnected provider (no connect() call)
						let tmpFable = new libFable(_FableConfig);
						tmpFable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						tmpFable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

						tmpFable.MeadowMongoDBProvider.createTable(_AnimalSchema,
							(pError) =>
							{
								Expect(pError).to.be.an('error');
								Expect(pError.message).to.contain('Not connected');
								return fDone();
							});
					}
				);
			}
		);
		suite
		(
			'Raw MongoDB Operations',
			() =>
			{
				let _Fable = null;

				suiteSetup
				(
					(fDone) =>
					{
						_Fable = new libFable(_FableConfig);
						_Fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
						_Fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');
						_Fable.MeadowMongoDBProvider.connect();

						// Set up a clean test collection with indexes
						let tmpDb = _Fable.MeadowMongoDBProvider.pool;
						tmpDb.collection('RawTestAnimal').drop()
							.catch(() => {})
							.then(() =>
							{
								return tmpDb.createCollection('RawTestAnimal');
							})
							.then(() =>
							{
								return fDone();
							})
							.catch((pError) => fDone(pError));
					}
				);

				suiteTeardown
				(
					(fDone) =>
					{
						let tmpDb = _Fable.MeadowMongoDBProvider.pool;
						tmpDb.collection('RawTestAnimal').drop()
							.catch(() => {})
							.then(() =>
							{
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone();
							})
							.catch(() =>
							{
								_Fable.MeadowMongoDBProvider.client.close();
								return fDone();
							});
					}
				);

				test
				(
					'insert and find documents',
					(fDone) =>
					{
						let tmpCollection = _Fable.MeadowMongoDBProvider.pool.collection('RawTestAnimal');

						tmpCollection.insertMany([
							{ IDAnimal: 1, Name: 'Fido', Type: 'Dog' },
							{ IDAnimal: 2, Name: 'Whiskers', Type: 'Cat' },
							{ IDAnimal: 3, Name: 'Polly', Type: 'Parrot' }
						])
						.then(() =>
						{
							return tmpCollection.find({}).sort({ IDAnimal: 1 }).toArray();
						})
						.then((pDocs) =>
						{
							Expect(pDocs).to.be.an('array');
							Expect(pDocs.length).to.equal(3);
							Expect(pDocs[0].Name).to.equal('Fido');
							Expect(pDocs[1].Name).to.equal('Whiskers');
							Expect(pDocs[2].Name).to.equal('Polly');
							return fDone();
						})
						.catch((pError) => fDone(pError));
					}
				);
				test
				(
					'update a document',
					(fDone) =>
					{
						let tmpCollection = _Fable.MeadowMongoDBProvider.pool.collection('RawTestAnimal');

						tmpCollection.updateOne(
							{ IDAnimal: 1 },
							{ $set: { Name: 'Rex' } }
						)
						.then((pResult) =>
						{
							Expect(pResult.modifiedCount).to.equal(1);
							return tmpCollection.findOne({ IDAnimal: 1 });
						})
						.then((pDoc) =>
						{
							Expect(pDoc.Name).to.equal('Rex');
							return fDone();
						})
						.catch((pError) => fDone(pError));
					}
				);
				test
				(
					'delete a document',
					(fDone) =>
					{
						let tmpCollection = _Fable.MeadowMongoDBProvider.pool.collection('RawTestAnimal');

						tmpCollection.deleteOne({ IDAnimal: 3 })
							.then((pResult) =>
							{
								Expect(pResult.deletedCount).to.equal(1);
								return tmpCollection.countDocuments();
							})
							.then((pCount) =>
							{
								Expect(pCount).to.equal(2);
								return fDone();
							})
							.catch((pError) => fDone(pError));
					}
				);
				test
				(
					'count documents with filter',
					(fDone) =>
					{
						let tmpCollection = _Fable.MeadowMongoDBProvider.pool.collection('RawTestAnimal');

						tmpCollection.countDocuments({ Type: 'Dog' })
							.then((pCount) =>
							{
								Expect(pCount).to.equal(1);
								return fDone();
							})
							.catch((pError) => fDone(pError));
					}
				);
			}
		);
	}
);
