using StackExchange.Redis;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;
using System;
using CequelSpace.Api.Models;
using System.Text.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CequelSpace.Api.Services.Connections.Redis {

  internal class RedisService : IRedisService {

    private JsonSerializerOptions options = new JsonSerializerOptions() { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingDefault };

    private ConnectionMultiplexer _muxer;
    private IDatabase _database;

    private RedisOptions _config;

    public RedisService(IOptions<RedisOptions> config) {
      _config = config.Value;

      Connect();
    }

    private void Connect() {
      var options = new ConfigurationOptions
      {
          EndPoints = { _config.EndPoint },
          Password = _config.Password,
          Ssl = _config.Ssl
      };

      options.CertificateSelection += delegate {
        return new X509Certificate2(_config.Certificate, "");
      };

      _muxer = ConnectionMultiplexer.Connect(options);
      _database = _muxer.GetDatabase(_config.Database);
    }

    public async Task<List<Connection>> GetAll(string userId) {
      var entries = await _database.HashGetAllAsync("u/" + userId + "/c");

      var result = new List<Connection>();

      foreach (var entry in entries) {
        result.Add(JsonSerializer.Deserialize<Connection>(entry.Value));
      }

      return result;
    }

    public async Task<Connection> GetById(string userId, Guid id) {
      var entry = await _database.HashGetAsync("u/" + userId + "/c", id.ToString());

      if (entry.IsNullOrEmpty) {
        return null;
      }

      return JsonSerializer.Deserialize<Connection>(entry);
    }

    public async Task<Guid> Add(string userId, Connection connection) {
      connection.ID = Guid.NewGuid();
      var json = JsonSerializer.SerializeToUtf8Bytes(connection, options);

      await _database.HashSetAsync("u/" + userId + "/c", connection.ID.ToString(), json);

      return connection.ID;
    }

    public async Task Delete(string userId, Guid connectionId) {
      await _database.HashDeleteAsync("u/" + userId + "/c", connectionId.ToString());
    }

    public async Task Update(string userId, Connection connection) {
      var json = JsonSerializer.SerializeToUtf8Bytes(connection, options);
      await _database.HashSetAsync("u/" + userId + "/c", connection.ID.ToString(), json);
    }
  }
}