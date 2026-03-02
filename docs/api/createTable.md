# createTable(pMeadowTableSchema, fCallback)

Creates a MongoDB collection and its indexes from a Meadow table schema. Handles existing collections gracefully.

## Signature

```javascript
createTable(pMeadowTableSchema, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMeadowTableSchema` | `object` | Meadow table schema with `TableName` and `Columns` array |
| `fCallback` | `function` | Callback receiving `(error)` |

## Return Value

Returns the result of the callback invocation.

## Behavior

1. Calls `generateCreateTableStatement(pMeadowTableSchema)` to build the descriptor
2. Validates that the database is connected (`this._Database`)
3. Calls `this._Database.createCollection(descriptor.collection)` (Promise-based)
4. If the collection has indexes, calls `collection.createIndexes(descriptor.indexes)`
5. On success: logs info, calls `fCallback()` with no error
6. On error code 48 (NamespaceExists): logs a warning, still creates indexes, calls `fCallback()`
7. On other errors: logs the error, calls `fCallback(pError)`

## Basic Usage

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
		console.log('Animal collection and indexes ready!');
	});
```

## Idempotent Collections

MongoDB returns error code 48 (`NamespaceExists`) when creating a collection that already exists. The connector handles this gracefully -- the error is logged as a warning and index creation still proceeds. This makes `createTable()` safe to call during application startup:

```javascript
// Safe to call repeatedly
_Fable.MeadowMongoDBProvider.createTable(tmpAnimalSchema,
	(pError) =>
	{
		// First call: creates collection + indexes
		// Subsequent calls: collection exists (code 48), indexes still created
	});
```

## Index Creation

Indexes are created after the collection. If the collection already existed (code 48), indexes are still created on the existing collection. If an index already exists, MongoDB handles it silently.

The connector generates indexes for these Meadow data types:

| DataType | Index | Unique |
|----------|-------|--------|
| `ID` | Ascending | Yes |
| `GUID` | Ascending | Yes |
| `ForeignKey` | Ascending | No |

## Not Connected

If the database is not connected, the callback receives an error immediately:

```javascript
// Before connecting
_Fable.MeadowMongoDBProvider.createTable(tmpSchema,
	(pError) =>
	{
		// pError: Error('Not connected to MongoDB')
	});
```

## Prerequisites

The connection must be established before calling `createTable()`:

```javascript
_Fable.MeadowMongoDBProvider.connectAsync(
	(pError) =>
	{
		if (pError) { return; }

		_Fable.MeadowMongoDBProvider.createTable(tmpAnimalSchema,
			(pCreateError) =>
			{
				if (pCreateError) { console.error(pCreateError); }
			});
	});
```

## Related

- [generateCreateTableStatement](generateCreateTableStatement.md) -- Generate descriptor without applying
- [createTables](createTables.md) -- Apply multiple schemas sequentially
- [generateDropTableStatement](generateDropTableStatement.md) -- Generate drop descriptor
- [Collections & Indexes](../schema.md) -- Full index mapping reference
