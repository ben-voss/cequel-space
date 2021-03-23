using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CequelSpace.Api.Models;

namespace CequelSpace.Api.Services.Connections {

  /// <summary>
  /// A service for managing the connections to databases.
  /// </summary>
  public interface IConnectionsService {
    /// <summary>
    /// Gets all the connections for the specified user.
    /// </summary>
    Task<List<Connection>> GetAll(string userId);

    /// <summary>
    /// Gets the connection with the specified ID.
    /// </summary>
    Task<Connection> GetById(string userId, Guid id);

    /// <summary>
    /// Adds the specified connection.
    /// </summary>
    Task<Guid> Add(string userId, Connection connection);

    /// <summary>
    /// Deletes the connection with the specified ID.
    /// </summary>
    Task Delete(string userId, Guid id);

    /// <summary>
    /// Updates the connection.
    /// </summary>
    Task Update(string userId, Connection connection);
  }
}