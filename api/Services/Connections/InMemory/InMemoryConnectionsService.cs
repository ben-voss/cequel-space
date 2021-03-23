using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using CequelSpace.Api.Models;

namespace CequelSpace.Api.Services.Connections.InMemory {

  internal class MemoryConnectionsService : IConnectionsService {

    private ConcurrentDictionary<string, ConcurrentDictionary<Guid, Connection>> _connectionsByUser = new ConcurrentDictionary<string, ConcurrentDictionary<Guid, Connection>>();

    public MemoryConnectionsService() {
    }

    public Task<List<Connection>> GetAll(string userId) {
      if (_connectionsByUser.TryGetValue(userId, out var connections)) {
        return Task.FromResult(new List<Connection>(connections.Values));
      } else {
        return Task.FromResult<List<Connection>>(null);
      }
    }

    public Task<Connection> GetById(string userId, Guid id) {
      if (_connectionsByUser.TryGetValue(userId, out var connections)) {
        Connection connection;
        connections.TryGetValue(id, out connection);
        return Task.FromResult(connection);
      } else {
        return Task.FromResult<Connection>(null);
      }
    }

    public Task<Guid> Add(string userId, Connection connection) {
      if (!_connectionsByUser.TryGetValue(userId, out var connections)) {
        connections = new ConcurrentDictionary<Guid, Connection>();
        _connectionsByUser.TryAdd(userId, connections);
      }

      connection.ID = Guid.NewGuid();
      connections.TryAdd(connection.ID, connection);

      return Task.FromResult(connection.ID);
    }

    public Task Delete(string userId, Guid id) {
      if (_connectionsByUser.TryGetValue(userId, out var connections)) {
        Connection existing;
        return Task.FromResult(connections.TryRemove(id, out existing));
      } else {
        return Task.CompletedTask;
      }
    }

    public Task Update(string userId, Connection connection) {
      if (!_connectionsByUser.TryGetValue(userId, out var connections)) {
        connections = new ConcurrentDictionary<Guid, Connection>();
        _connectionsByUser.TryAdd(userId, connections);
      }

      Connection existing;
      connections.Remove(connection.ID, out existing);
      return Task.FromResult(connections.TryAdd(connection.ID, connection));
    }
  }
}