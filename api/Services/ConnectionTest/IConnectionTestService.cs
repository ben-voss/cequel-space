using System;
using System.Threading.Tasks;
using CequelSpace.Api.Models;

namespace CequelSpace.Api.Services.ConnectionTest {

  /// <summary>
  /// A service for testing the connection to a database.
  /// </summary>
  public interface IConnectionTestService {
    /// <summary>
    /// Starts a new connection test with the specified connection settings.
    /// </summary>
    Guid Start(Connection connection);

    /// <summary>
    /// Cancels the connection test with the specified ID.
    /// </summary>
    void Cancel(Guid id);

    /// <summary>
    /// Gets the results of the connection test with the specified ID.
    /// </summary>
    Task<bool> GetResult(Guid id);
  }
}