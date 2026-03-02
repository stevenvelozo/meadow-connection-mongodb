# connect()

Synchronous method that creates the MongoDB client and obtains the database handle.

## Signature

```javascript
connect()
```

## Parameters

None.

## Return Value

None.

## Behavior

1. If already connected (`this._Client` exists), logs an error with masked password and returns
2. Builds the connection URI via `_buildConnectionURI()`
3. Creates a new `MongoClient` with the URI and pool size option
4. Calls `client.db(database)` to obtain the `Db` instance
5. Sets `this.connected = true`

## Usage

```javascript
_Fable.MeadowMongoDBProvider.connect();

if (_Fable.MeadowMongoDBProvider.connected)
{
	let tmpDB = _Fable.MeadowMongoDBProvider.pool;
	// Use the Db instance
}
```

## Why Both connect() and connectAsync()?

The MongoDB Node.js driver v6 creates connections lazily -- the `MongoClient` constructor and `client.db()` are synchronous, with actual TCP connections established on first use. The `connect()` method works reliably for immediate use. However, `connectAsync()` is preferred because:

- It follows the Fable service provider convention
- It provides error handling via the callback
- It guards against missing callbacks
- It is consistent with other Meadow connector APIs

## Double-Connect Protection

If `connect()` is called when already connected, it logs an error with the settings (password masked) and returns without action:

```javascript
_Fable.MeadowMongoDBProvider.connect();
_Fable.MeadowMongoDBProvider.connect();
// Logs: "Meadow-Connection-MongoDB trying to connect but is already connected - skipping."
// Settings logged with password: '*****************'
```

## Auto-Connect

The `connect()` method is called automatically during construction if `MeadowConnectionMongoDBAutoConnect` is `true`:

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

## Connection URI Format

The `_buildConnectionURI()` method builds the URI from configuration:

```
mongodb://host:port/database                          (no auth)
mongodb://user:password@host:port/database            (with auth)
```

Credentials are URL-encoded with `encodeURIComponent()` to handle special characters safely.

## Related

- [connectAsync](connectAsync.md) -- Callback-style connection (recommended)
- [pool](pool.md) -- Access the Db instance after connecting
- [client](client.md) -- Access the raw MongoClient
