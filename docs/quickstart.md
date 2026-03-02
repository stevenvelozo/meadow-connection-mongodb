# Quickstart

Get a MongoDB connection running in five steps.

## Step 1: Install

```bash
npm install meadow-connection-mongodb fable
```

Requires a running MongoDB instance (local or remote). The module uses the official `mongodb` driver v6.

## Step 2: Configure and Connect

```javascript
const libFable = require('fable');
const libMeadowConnectionMongoDB = require('meadow-connection-mongodb');

let _Fable = new libFable(
	{
		"MongoDB":
		{
			"Server": "localhost",
			"Port": 27017,
			"Database": "myapp"
		}
	});

_Fable.serviceManager.addAndInstantiateServiceType(
	'MeadowMongoDBProvider', libMeadowConnectionMongoDB);

_Fable.MeadowMongoDBProvider.connectAsync(
	(pError, pDatabase) =>
	{
		if (pError)
		{
			console.error('Connection failed:', pError);
			return;
		}
		console.log('Connected to MongoDB!');
	});
```

## Step 3: Create a Collection

Define a Meadow table schema and apply it. Collections that already exist are preserved -- the driver handles the `NamespaceExists` error gracefully and still creates any new indexes.

```javascript
let tmpAnimalSchema =
{
	TableName: 'Animal',
	Columns:
	[
		{ Column: 'IDAnimal', DataType: 'ID' },
		{ Column: 'GUIDAnimal', DataType: 'GUID' },
		{ Column: 'Name', DataType: 'String' },
		{ Column: 'Age', DataType: 'Numeric' },
		{ Column: 'IDFarm', DataType: 'ForeignKey' }
	]
};

_Fable.MeadowMongoDBProvider.createTable(tmpAnimalSchema,
	(pError) =>
	{
		if (pError)
		{
			console.error('Collection creation failed:', pError);
			return;
		}
		console.log('Animal collection ready with indexes!');
	});
```

This creates the `Animal` collection with three indexes:

| Column | Index Type |
|--------|-----------|
| `IDAnimal` | Unique ascending |
| `GUIDAnimal` | Unique ascending |
| `IDFarm` | Non-unique ascending |

## Step 4: Use the Db Instance

Access the MongoDB `Db` handle via the `pool` getter and run native MongoDB operations:

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');

// Insert a document
tmpCollection.insertOne(
	{
		IDAnimal: 1,
		GUIDAnimal: '550e8400-e29b-41d4-a716-446655440000',
		Name: 'Fido',
		Age: 3,
		IDFarm: 42
	})
	.then((pResult) =>
	{
		console.log('Inserted:', pResult.insertedId);
	});
```

## Step 5: Use with Meadow

For full ORM capabilities, pair this connection with the Meadow data access layer and FoxHound query generator:

```javascript
const libMeadow = require('meadow');

let tmpAnimalMeadow = libMeadow.new(_Fable, 'Animal')
	.setProvider('MongoDB')
	.setDefaultIdentifier('IDAnimal')
	.setSchema(
	[
		{ Column: 'IDAnimal', Type: 'AutoIdentity' },
		{ Column: 'GUIDAnimal', Type: 'AutoGUID' },
		{ Column: 'Name', Type: 'String' },
		{ Column: 'Age', Type: 'Number' },
		{ Column: 'IDFarm', Type: 'Number' }
	]);

// Meadow handles CRUD through FoxHound's MongoDB dialect
let tmpQuery = tmpAnimalMeadow.query.addRecord(
	{
		Name: 'Luna',
		Age: 5,
		IDFarm: 42
	});

tmpAnimalMeadow.doCreate(tmpQuery,
	(pQuery) =>
	{
		console.log('Created with ID:', pQuery.parameters.result.value);
	});
```

## With Authentication

For authenticated MongoDB instances, add `User` and `Password` to your settings:

```javascript
let _Fable = new libFable(
	{
		"MongoDB":
		{
			"Server": "db.example.com",
			"Port": 27017,
			"User": "appuser",
			"Password": "s3cret!pass",
			"Database": "production",
			"ConnectionPoolLimit": 25
		}
	});
```

The driver builds the URI `mongodb://appuser:s3cret%21pass@db.example.com:27017/production` with the password URL-encoded automatically.

## Auto-Connect Mode

Skip the explicit `connectAsync()` call by enabling auto-connect:

```javascript
let _Fable = new libFable(
	{
		"MongoDB":
		{
			"Server": "localhost",
			"Port": 27017,
			"Database": "myapp"
		},
		"MeadowConnectionMongoDBAutoConnect": true
	});

_Fable.serviceManager.addAndInstantiateServiceType(
	'MeadowMongoDBProvider', libMeadowConnectionMongoDB);

// Already connected -- pool is ready
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
```
