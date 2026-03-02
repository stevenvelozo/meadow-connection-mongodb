# createTables(pMeadowSchema, fCallback)

Creates multiple MongoDB collections and their indexes sequentially from a Stricture schema object.

## Signature

```javascript
createTables(pMeadowSchema, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMeadowSchema` | `object` | Schema with a `Tables` array of Meadow table schemas |
| `fCallback` | `function` | Callback receiving `(error)` |

## Return Value

Returns the result of the callback invocation.

## Behavior

1. Iterates over `pMeadowSchema.Tables` using `fable.Utility.eachLimit` with concurrency of 1
2. Calls `this.createTable(table, callback)` for each table
3. On completion: logs info, calls `fCallback()` with no error
4. On error: logs the error, calls `fCallback(pError)`

## Basic Usage

```javascript
let tmpSchema =
{
	Tables:
	[
		{
			TableName: 'Animal',
			Columns:
			[
				{ Column: 'IDAnimal', DataType: 'ID' },
				{ Column: 'GUIDAnimal', DataType: 'GUID' },
				{ Column: 'Name', DataType: 'String' },
				{ Column: 'IDFarm', DataType: 'ForeignKey' }
			]
		},
		{
			TableName: 'Farm',
			Columns:
			[
				{ Column: 'IDFarm', DataType: 'ID' },
				{ Column: 'GUIDFarm', DataType: 'GUID' },
				{ Column: 'FarmName', DataType: 'String' }
			]
		},
		{
			TableName: 'Veterinarian',
			Columns:
			[
				{ Column: 'IDVeterinarian', DataType: 'ID' },
				{ Column: 'GUIDVeterinarian', DataType: 'GUID' },
				{ Column: 'LastName', DataType: 'String' },
				{ Column: 'IDFarm', DataType: 'ForeignKey' }
			]
		}
	]
};

_Fable.MeadowMongoDBProvider.createTables(tmpSchema,
	(pError) =>
	{
		if (pError)
		{
			console.error('Schema creation failed:', pError);
			return;
		}
		console.log('All collections created!');
	});
```

## Sequential Processing

Collections are created one at a time (concurrency of 1) using `fable.Utility.eachLimit`. This ensures:

- Deterministic creation order
- Clear log output showing each collection as it is created
- Predictable error reporting -- the first failure stops the sequence

## Error Handling

If any collection fails to create (other than the expected `NamespaceExists` code 48), the error is passed to the callback and remaining collections are skipped:

```javascript
_Fable.MeadowMongoDBProvider.createTables(tmpSchema,
	(pError) =>
	{
		if (pError)
		{
			// Only the first error is reported
			console.error('Failed during schema creation:', pError);
		}
	});
```

## Application Startup Pattern

Since `createTable()` handles existing collections gracefully, `createTables()` is safe to call on every application startup:

```javascript
_Fable.MeadowMongoDBProvider.connectAsync(
	(pError) =>
	{
		if (pError) { return console.error(pError); }

		_Fable.MeadowMongoDBProvider.createTables(appSchema,
			(pSchemaError) =>
			{
				if (pSchemaError) { return console.error(pSchemaError); }
				console.log('Database ready -- starting application');
				startApp();
			});
	});
```

## Related

- [createTable](createTable.md) -- Create a single collection
- [generateCreateTableStatement](generateCreateTableStatement.md) -- Generate a descriptor
- [Collections & Indexes](../schema.md) -- Full index mapping reference
