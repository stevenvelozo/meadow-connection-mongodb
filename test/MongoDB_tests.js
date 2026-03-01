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
				"Port": 27017,
				"User": "",
				"Password": "",
				"Database": "testdb",
				"ConnectionPoolLimit": 20
			}
	});

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

						let tmpSchema = {
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

						let tmpResult = _Fable.MeadowMongoDBProvider.generateCreateTableStatement(tmpSchema);
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
						Expect(tmpURI).to.equal('mongodb://127.0.0.1:27017/testdb');
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
	}
);
