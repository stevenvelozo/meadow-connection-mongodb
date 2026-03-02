# connectAsync(fCallback)

Callback-style connection method. Creates the `MongoClient` and obtains the `Db` instance, or returns the existing connection if already connected.

## Signature

```javascript
connectAsync(fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fCallback` | `function` | Callback receiving `(error, database)` |

## Return Value

Returns the result of the callback invocation.

## Behavior

1. If no callback is provided, logs an error and substitutes a no-op function
2. If already connected (`this._Client` exists), calls `fCallback(null, this._Database)` immediately
3. Otherwise, calls `this.connect()` to create the client and database handle
4. On success: calls `fCallback(null, this._Database)`
5. On error: logs the error, calls `fCallback(pError)`

## Basic Usage

```javascript
_Fable.MeadowMongoDBProvider.connectAsync(
	(pError, pDatabase) =>
	{
		if (pError)
		{
			console.error('Connection failed:', pError);
			return;
		}
		console.log('Connected! Database:', pDatabase.databaseName);
	});
```

## Idempotent Calls

Calling `connectAsync()` multiple times is safe. If already connected, the existing `Db` instance is returned without creating a new connection:

```javascript
// First call -- creates the connection
_Fable.MeadowMongoDBProvider.connectAsync(
	(pError, pDatabase) =>
	{
		// pDatabase is the Db instance

		// Second call -- reuses the existing connection
		_Fable.MeadowMongoDBProvider.connectAsync(
			(pError2, pDatabase2) =>
			{
				// pDatabase2 === pDatabase (same Db instance)
			});
	});
```

## Missing Callback

If called without a callback, a warning is logged and a no-op function is used:

```javascript
// Logs: "Meadow MongoDB connectAsync() called without a callback."
_Fable.MeadowMongoDBProvider.connectAsync();
```

## Error Handling

If `connect()` throws, the error is caught and passed to the callback:

```javascript
_Fable.MeadowMongoDBProvider.connectAsync(
	(pError) =>
	{
		if (pError)
		{
			// Handle connection failure
			console.error('MongoDB connection error:', pError.message);
		}
	});
```

## Related

- [connect()](connect.md) -- Synchronous connection method
- [pool](pool.md) -- Access the Db instance after connecting
- [client](client.md) -- Access the raw MongoClient
