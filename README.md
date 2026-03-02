# meadow-connection-mongodb

MongoDB connection service for the Meadow data access layer.

[![Coverage Status](https://coveralls.io/repos/github/stevenvelozo/meadow-connection-mongodb/badge.svg?branch=main)](https://coveralls.io/github/stevenvelozo/meadow-connection-mongodb?branch=main)
[![Build Status](https://github.com/stevenvelozo/meadow-connection-mongodb/workflows/Tests/badge.svg)](https://github.com/stevenvelozo/meadow-connection-mongodb/actions)
[![npm version](https://badge.fury.io/js/meadow-connection-mongodb.svg)](https://www.npmjs.com/package/meadow-connection-mongodb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Fable Service Provider** -- integrates with the Fable dependency injection ecosystem
- **Connection Pooling** -- built-in pool management via the official MongoDB Node.js driver
- **Collection & Index Management** -- automatic collection creation and index generation from Meadow schemas
- **Meadow-Compatible Settings** -- accepts both Meadow-style (`Server`, `Port`) and native MongoDB property names
- **Authentication Support** -- optional username/password credentials with URL-encoded connection URIs
- **Auto-Connect Mode** -- optionally connect during service construction
- **Idempotent Schema** -- safe to call `createTable()` on startup; existing collections are preserved

## Installation

```shell
npm install meadow-connection-mongodb
```

## Quick Start

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
		if (pError) { return console.error(pError); }

		let tmpDB = _Fable.MeadowMongoDBProvider.pool;
		// tmpDB is the MongoDB Db instance -- ready for queries
	});
```

## Configuration

Settings are read from `fable.settings.MongoDB`:

| Setting | Alias | Default | Description |
|---------|-------|---------|-------------|
| `Server` | `host` | `127.0.0.1` | MongoDB host |
| `Port` | `port` | `27017` | MongoDB port |
| `User` | `user` | `''` | Authentication username |
| `Password` | `password` | `''` | Authentication password |
| `Database` | `database` | `test` | Database name |
| `ConnectionPoolLimit` | `maxPoolSize` | `10` | Maximum connections in pool |

## API

| Method | Description |
|--------|-------------|
| `connect()` | Synchronous -- create MongoClient and Db handle |
| `connectAsync(fCallback)` | Callback-style connection (recommended) |
| `pool` | Getter -- returns the `Db` instance |
| `client` | Getter -- returns the raw `MongoClient` |
| `generateCreateTableStatement(schema)` | Generate a collection/index descriptor |
| `createTable(schema, fCallback)` | Create a collection and its indexes |
| `createTables(schema, fCallback)` | Create multiple collections sequentially |
| `generateDropTableStatement(name)` | Generate a drop descriptor |

## Collection & Index Mapping

| Meadow DataType | Index Created | Unique |
|-----------------|---------------|--------|
| `ID` | Ascending | Yes |
| `GUID` | Ascending | Yes |
| `ForeignKey` | Ascending | No |
| `String` | None | -- |
| `Numeric` | None | -- |
| `Decimal` | None | -- |
| `Text` | None | -- |
| `DateTime` | None | -- |
| `Boolean` | None | -- |

## Part of the Retold Framework

This module is a Meadow connector that plugs into the Retold application framework. It provides the MongoDB persistence layer for the Meadow data access abstraction.

## Testing

```shell
npm test
```

Coverage:

```shell
npm run coverage
```

## Related Packages

- [meadow](https://github.com/stevenvelozo/meadow) -- Data access layer and ORM
- [fable](https://github.com/stevenvelozo/fable) -- Application framework and service manager
- [foxhound](https://github.com/stevenvelozo/foxhound) -- Query generation DSL (includes MongoDB dialect)
- [stricture](https://github.com/stevenvelozo/stricture) -- Schema definition and DDL tools
- [meadow-endpoints](https://github.com/stevenvelozo/meadow-endpoints) -- RESTful endpoint generation
- [meadow-connection-mysql](https://github.com/stevenvelozo/meadow-connection-mysql) -- MySQL/MariaDB connector
- [meadow-connection-mssql](https://github.com/stevenvelozo/meadow-connection-mssql) -- Microsoft SQL Server connector
- [meadow-connection-sqlite](https://github.com/stevenvelozo/meadow-connection-sqlite) -- SQLite connector

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
