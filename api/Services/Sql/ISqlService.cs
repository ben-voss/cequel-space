using System;
using System.Collections.Generic;
using CequelSpace.Api.Models;

namespace CequelSpace.Api.Services.Sql {

  /// <summary>
  /// A service for executing queries on a database.
  /// </summary>
  public interface ISqlService {
    /// <summary>
    /// Starts a new query with the specified connection settings.
    /// </summary>
    Guid StartQuery(string userId, Connection connection, string query);

    /// <summary>
    /// Cancels the query with the specified ID.
    /// </summary>    
    void CancelQuery(string userId, Guid id);

    /// <summary>
    /// Gets the results of the query with the specified ID.
    /// </summary>
    IAsyncEnumerable<RecordSet> GetResult(string userId, Guid requestId);
  }
}