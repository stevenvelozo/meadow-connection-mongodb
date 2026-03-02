# generateDropTableStatement(pTableName)

Generates a drop descriptor for a MongoDB collection. Returns the descriptor without actually dropping the collection.

## Signature

```javascript
generateDropTableStatement(pTableName)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pTableName` | `string` | The name of the collection to drop |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `operation` | `string` | Always `'drop'` |
| `collection` | `string` | The collection name |

## Basic Usage

```javascript
let tmpDescriptor = _Fable.MeadowMongoDBProvider.generateDropTableStatement('Animal');

console.log(tmpDescriptor);
// => { operation: 'drop', collection: 'Animal' }
```

## Purpose

This method returns a descriptor object that the Meadow provider layer uses to issue the actual `db.dropCollection()` call. The connector itself does not execute the drop -- it only describes what should happen.

## Using the Descriptor

To actually drop a collection, use the descriptor with the `pool` getter:

```javascript
let tmpDescriptor = _Fable.MeadowMongoDBProvider.generateDropTableStatement('Animal');
let tmpDB = _Fable.MeadowMongoDBProvider.pool;

tmpDB.dropCollection(tmpDescriptor.collection)
	.then(() =>
	{
		console.log(`Collection ${tmpDescriptor.collection} dropped.`);
	})
	.catch((pError) =>
	{
		console.error('Drop failed:', pError);
	});
```

## Differences from SQL DDL

| Feature | SQL Connectors | MongoDB |
|---------|---------------|---------|
| Output | `DROP TABLE TableName` string | `{ operation: 'drop', collection: name }` |
| Cascading | May drop dependent objects | Drops collection and its indexes |
| Idempotent | `IF EXISTS` clause | Must handle error if collection does not exist |

## Related

- [generateCreateTableStatement](generateCreateTableStatement.md) -- Generate create descriptor
- [createTable](createTable.md) -- Create a collection and indexes
- [Collections & Indexes](../schema.md) -- Full index mapping reference
