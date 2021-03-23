using System;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using CequelSpace.Api.Models;

namespace CequelSpace.Api.Services.ConnectionTest {

    internal class ConnectionTestService : IConnectionTestService {
        private class QueryTask {
            public CancellationToken Token { get; }
            public CancellationTokenSource Source { get; }
            public Task<bool> Task{ get; }
            public DateTime StartTime { get; }

            public QueryTask(CancellationToken token, CancellationTokenSource source, Task<bool> task, DateTime startTime) {
                Token = token;
                Source = source;
                Task = task;
                StartTime = startTime;
            }
        }

        private readonly ILogger<ConnectionTestService> _logger;

        private readonly ConcurrentDictionary<Guid, QueryTask> _tasks = new ConcurrentDictionary<Guid, QueryTask>();

        public ConnectionTestService(ILogger<ConnectionTestService> logger) {
            _logger = logger;
        }

        public Guid Start(Connection connection) {

            // Define a unique ID for this request
            var id = Guid.NewGuid();

            // Define the cancellation token.
            CancellationTokenSource source = new CancellationTokenSource();
            CancellationToken token = source.Token;

            _logger.LogInformation("Starting request {id}", id);

            // Begin the operation
            var task = InternalStart(connection, token);

            if (!_tasks.TryAdd(id, new QueryTask(token, source, task, DateTime.UtcNow))) {
                throw new ApplicationException("Internal error");
            }

            return id;
        }

        public void Cancel(Guid id) {
            QueryTask queryTask;
            if (_tasks.TryRemove(id, out queryTask)) {
                _logger.LogInformation("Cancelling {id}", id);
                queryTask.Source.Cancel();
            }
        }

        public Task<bool> GetResult(Guid id) {
            QueryTask queryTask;
            if (!_tasks.TryGetValue(id, out queryTask)) {
                return null;
            }

            _logger.LogInformation("Getting results for {id}", id);

            return queryTask.Task;
        }

        private string BuildConnectionString(Connection connection) {
            var builder = new SqlConnectionStringBuilder();
            builder.ApplicationName = "Cequel.Space";

            if (connection.Port != null) {
                builder.DataSource = connection.HostName + ";" + connection.Port.Value;
            } else {
                builder.DataSource = connection.HostName;
            }

            builder.InitialCatalog = connection.Database;

            builder.UserID = connection.Username;
            builder.Password = connection.Password;

            return builder.ConnectionString;
        }

        private async Task<bool> InternalStart(Connection connection, CancellationToken token) {
            try {
                var task = new Task(async () => {
                    _logger.LogInformation("Starting test");

                    token.ThrowIfCancellationRequested();

                    // First try and resolve the host name
                    var dnsTask = Dns.GetHostAddressesAsync(connection.HostName);
                    dnsTask.Wait(token);
                    var hostEntry = dnsTask.Result;

                    if (hostEntry.Length == 0) {
                        throw new ApplicationException("Unable to resolve hostname.");
                    }
                
                    token.ThrowIfCancellationRequested();

                    var port = 1433;
                    if (connection.Port != null) {
                        port = connection.Port.Value;
                    }

                    // Can we open a socket
                    var waitHandle = new ManualResetEvent(false);
                    IPEndPoint ipe = new IPEndPoint(hostEntry[0], port);
                    var socket = new Socket(ipe.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
                    try {             
                        var ar = socket.BeginConnect(ipe, (ar) => {
                            waitHandle.Set();
                        }, null);

                        // Cancel the socket if the cancellation is invoked by closing it.
                        token.Register(() => {
                            try {
                                socket.Close();
                            } catch (Exception) {
                                // Ignore any error here - the socket may have already been closed.
                            }
                        });

                        // Wait for the connection to complete
                        waitHandle.WaitOne();

                        // End the connection - throws an object disposed exception if called on a cancelled socket
                        socket.EndConnect(ar);

                        socket.Close();
                        socket.Dispose();
                    } catch (ObjectDisposedException) {
                        return;
                    } catch (SocketException) {
                        throw new ApplicationException("Unable to establish socket connection.");
                    } 

                    token.ThrowIfCancellationRequested();

                    // Finally connect and run a query
                    using (var sqlConnection = new SqlConnection(BuildConnectionString(connection))) {
                        await sqlConnection.OpenAsync(token);

                        using (var command = new SqlCommand()) {
                            command.Connection = sqlConnection;
                            command.CommandText = "SELECT 42";

                            await command.ExecuteScalarAsync(token);
                        }
                    }
                });

                task.Start();

                await task;

                return true;
            } catch (Exception) {
                return false;
            }
        }
    }
}