using System;

namespace CequelSpace.Api.Models {
  /// <summary>
  /// Represents a SQL batch to execute on a database.
  /// </summary>
  public class BatchJob {
    /// <summary>
    /// The ID of the connection to run the query on.
    /// </summary>
    public Guid ConnectionId { get; set; }

    /// <summary>
    /// The query to execute.
    /// </summary>
    public string Query { get; set; }
  }
}