using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using CequelSpace.Api.Models;

namespace CequelSpace.Api.Services.Sql {

    internal class SqlService : ISqlService {
        private class QueryTask {
            public string UserId { get; }
            public CancellationToken Token { get; }
            public CancellationTokenSource Source { get; }
            public IAsyncEnumerable<RecordSet> Task{ get; }
            public DateTime StartTime { get; }

            public QueryTask(string userId, CancellationToken token, CancellationTokenSource source, IAsyncEnumerable<RecordSet> task, DateTime startTime) {
                UserId = userId;
                Token = token;
                Source = source;
                Task = task;
                StartTime = startTime;
            }
        }

        private readonly ILogger<SqlService> _logger;

        private readonly ConcurrentDictionary<Guid, QueryTask> _tasks = new ConcurrentDictionary<Guid, QueryTask>();

        public SqlService(ILogger<SqlService> logger) {
            _logger = logger;
        }

        public Guid StartQuery(string userId, Connection connection, string query) {

            // Define a unique ID for this request
            var requestId = Guid.NewGuid();

            // Define the cancellation token.
            CancellationTokenSource source = new CancellationTokenSource();
            CancellationToken token = source.Token;

            _logger.LogInformation("Starting request {requestId} with {query}", requestId, query);

            // Begin the operation
            var task = InternalExecMultiple(connection, query, token);

            if (!_tasks.TryAdd(requestId, new QueryTask(userId, token, source, task, DateTime.UtcNow))) {
                throw new ApplicationException("Internal error");
            }

            return requestId;
        }

        public void CancelQuery(string userId, Guid requestId) {
            QueryTask queryTask;
            if (_tasks.TryRemove(requestId, out queryTask)) {
                
                if (queryTask.UserId != userId) {
                    return;
                }

                _logger.LogInformation("Cancelling {requestId}", requestId);
                queryTask.Source.Cancel();
            }
        }

        public IAsyncEnumerable<RecordSet> GetResult(string userId, Guid requestId) {
            QueryTask queryTask;
            if (!_tasks.TryGetValue(requestId, out queryTask)) {
                return null;
            }

            if (queryTask.UserId != userId) {
                return null;
            }

            _logger.LogInformation("Getting results for {requestId}", requestId);

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

        private async IAsyncEnumerable<RecordSet> InternalExecMultiple(Connection connection, string query, [EnumeratorCancellation] CancellationToken token) {
            using (var sqlConnection = new SqlConnection(BuildConnectionString(connection))) {
                // Capture messages generated along side the main resultset loop
                List<string> messages = new List<string>();
                sqlConnection.InfoMessage += (s, a) => {
                    messages.Add(a.Message);
                };

                await sqlConnection.OpenAsync(token);

                using (var command = new SqlCommand()) {
                    command.Connection = sqlConnection;
                    command.CommandText = query;

                    using (var result = await command.ExecuteReaderAsync(CommandBehavior.CloseConnection, token)) {
                        do {
                            token.ThrowIfCancellationRequested();

                            // Return any messages that accumulated before this result
                            foreach (var message in messages) {
                                yield return new RecordSet() {
                                    Message = message
                                };
                            }
                            messages.Clear();

                            // Return the result
                            var schema = result.GetColumnSchema();
                            var colCount = schema.Count;
                            var headers = new string[colCount];
                            for (int i = 0; i < colCount; i++) {
                                headers[i] = schema[i].ColumnName;
                            }
                        
                            var rows = new List<object[]>();
                            if (result.HasRows) {
                                
                                while (await result.ReadAsync(token)) {

                                    token.ThrowIfCancellationRequested();

                                    var row = new object[colCount];

                                    for (var i = 0; i < colCount; i++) {
                                        if (!await result.IsDBNullAsync(i, token)) {
                                            row[i] = result.GetValue(i);
                                        }
                                    }

                                    rows.Add(row);
                                }
                            }

                            yield return new RecordSet() {
                                Headers = headers,
                                Data = rows.ToArray()
                            };
                        } while (await result.NextResultAsync(token));
                    }
                }
            }
        }
    }
}