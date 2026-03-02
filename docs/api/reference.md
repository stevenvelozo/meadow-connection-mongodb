# API Reference

Complete reference for `meadow-connection-mongodb`.

## Service Information

| Property | Value |
|----------|-------|
| Service Type | `MeadowConnectionMongoDB` |
| Extends | `fable-serviceproviderbase` |
| Driver | `mongodb` ^6.12.0 |

## Connection Methods

### [connectAsync(fCallback)](connectAsync.md)

Callback-style connection method (recommended). Creates the `MongoClient` and obtains the `Db` instance for the configured database. If already connected, returns the existing `Db` immediately.

```javascript
_Fable.MeadowMongoDBProvider.connectAsync(
	(pError, pDatabase) =>
	{
		if (pError) { return console.error(pError); }
		// pDatabase is the Db instance
	});
```

### [connect()](connect.md)

Synchronous connection method. Creates the `MongoClient` from the connection URI and gets the `Db` handle. Called automatically when `MeadowConnectionMongoDBAutoConnect` is `true`.

```javascript
_Fable.MeadowMongoDBProvider.connect();
```

## Accessors

### [pool](pool.md)

Getter that returns the MongoDB `Db` instance. Provides access to collections, queries, aggregations, and all database-level operations.

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');
```

### [client](client.md)

Getter that returns the raw `MongoClient` instance. Useful for server-level operations, session management, and accessing other databases on the same server.

```javascript
let tmpClient = _Fable.MeadowMongoDBProvider.client;
let tmpOtherDB = tmpClient.db('analytics');
```

## Schema Management

### [generateCreateTableStatement(pMeadowTableSchema)](generateCreateTableStatement.md)

Generates a collection and index descriptor from a Meadow table schema. Returns the descriptor without applying it.

```javascript
let tmpDescriptor = _Fable.MeadowMongoDBProvider.generateCreateTableStatement(tmpSchema);
// => { operation: 'createCollection', collection: 'Animal', indexes: [...] }
```

### [createTable(pMeadowTableSchema, fCallback)](createTable.md)

Creates a MongoDB collection and its indexes from a Meadow table schema. Handles existing collections gracefully (error code 48).

```javascript
_Fable.MeadowMongoDBProvider.createTable(tmpAnimalSchema,
	(pError) =>
	{
		if (pError) { console.error(pError); }
	});
```

### [createTables(pMeadowSchema, fCallback)](createTables.md)

Creates multiple collections and their indexes from a Stricture schema. Collections are created sequentially.

```javascript
_Fable.MeadowMongoDBProvider.createTables(tmpSchema,
	(pError) =>
	{
		if (pError) { console.error(pError); }
	});
```

### [generateDropTableStatement(pTableName)](generateDropTableStatement.md)

Generates a drop descriptor for a collection. Returns the descriptor without dropping anything.

```javascript
let tmpDrop = _Fable.MeadowMongoDBProvider.generateDropTableStatement('Animal');
// => { operation: 'drop', collection: 'Animal' }
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `connected` | `boolean` | `true` after successful connection |
| `serviceType` | `string` | Always `'MeadowConnectionMongoDB'` |
| `options.MongoDB` | `object` | Resolved connection settings |

## Method Summary

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `void` | Synchronous connection |
| `connectAsync(fCallback)` | `void` | Callback-style connection |
| `pool` | `Db` / `false` | MongoDB Db instance |
| `client` | `MongoClient` / `false` | Raw MongoClient |
| `generateCreateTableStatement(schema)` | `object` | Collection/index descriptor |
| `createTable(schema, fCallback)` | `void` | Create collection and indexes |
| `createTables(schema, fCallback)` | `void` | Create multiple collections |
| `generateDropTableStatement(name)` | `object` | Drop descriptor |
