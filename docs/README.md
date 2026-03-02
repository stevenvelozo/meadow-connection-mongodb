# meadow-connection-mongodb

MongoDB connection service for the Meadow data access layer. This module provides connection management, collection creation, and index generation for applications using MongoDB as their persistence store.

## Quick Start

```javascript
const libFable = require('fable');
const libMeadowConnectionMongoDB = require('meadow-connection-mongodb');

// 1. Create a Fable instance with MongoDB settings
let _Fable = new libFable(
	{
		"MongoDB":
		{
			"Server": "localhost",
			"Port": 27017,
			"Database": "myapp"
		}
	});

// 2. Register and instantiate the service
_Fable.serviceManager.addAndInstantiateServiceType(
	'MeadowMongoDBProvider', libMeadowConnectionMongoDB);

// 3. Connect
_Fable.MeadowMongoDBProvider.connectAsync(
	(pError, pDatabase) =>
	{
		if (pError) { return console.error(pError); }

		// 4. Use the Db instance
		let tmpDB = _Fable.MeadowMongoDBProvider.pool;
		let tmpCollection = tmpDB.collection('animals');

		tmpCollection.find({}).toArray()
			.then((pDocs) => { console.log(pDocs); });
	});
```

## Configuration

Settings are read from `fable.settings.MongoDB`. Both Meadow-style names and native MongoDB names are supported:

| Setting | Alias | Default | Description |
|---------|-------|---------|-------------|
| `Server` | `host` | `127.0.0.1` | MongoDB hostname or IP |
| `Port` | `port` | `27017` | MongoDB port |
| `User` | `user` | `''` | Authentication username |
| `Password` | `password` | `''` | Authentication password |
| `Database` | `database` | `test` | Target database name |
| `ConnectionPoolLimit` | `maxPoolSize` | `10` | Maximum connection pool size |

### Connection URI

The driver builds a standard MongoDB connection URI from these settings:

```
mongodb://host:port/database
mongodb://user:password@host:port/database   (with authentication)
```

Credentials are URL-encoded automatically for safe handling of special characters.

## How It Fits

```
Application
    |
    v
 Meadow (ORM)
    |
    v
 FoxHound (MongoDB Dialect)
    |
    v
 meadow-connection-mongodb  <-- this module
    |
    v
 Official MongoDB Driver (mongodb ^6.12.0)
    |
    v
 MongoDB Server
```

## Learn More

- [Quickstart Guide](quickstart.md) -- step-by-step setup
- [Architecture](architecture.md) -- connection lifecycle and design diagrams
- [Collections & Indexes](schema.md) -- collection creation and index mapping
- [API Reference](api/reference.md) -- complete method documentation

## Companion Modules

| Module | Purpose |
|--------|---------|
| [meadow](https://github.com/stevenvelozo/meadow) | Data access layer and ORM |
| [foxhound](https://github.com/stevenvelozo/foxhound) | Query generation DSL (MongoDB dialect) |
| [stricture](https://github.com/stevenvelozo/stricture) | Schema definition and DDL tools |
| [meadow-connection-mysql](https://github.com/stevenvelozo/meadow-connection-mysql) | MySQL / MariaDB connector |
| [meadow-connection-mssql](https://github.com/stevenvelozo/meadow-connection-mssql) | Microsoft SQL Server connector |
| [meadow-connection-sqlite](https://github.com/stevenvelozo/meadow-connection-sqlite) | SQLite connector |
| [meadow-connection-rocksdb](https://github.com/stevenvelozo/meadow-connection-rocksdb) | RocksDB key-value connector |
| [meadow-connection-dgraph](https://github.com/stevenvelozo/meadow-connection-dgraph) | Dgraph graph database connector |
