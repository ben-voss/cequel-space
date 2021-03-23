using System;

namespace CequelSpace.Api.Models {

  /// <summary>
  /// The configuration settings for a database connection.
  /// </summary>
  public class Connection : Identifiable {
    /// <summary>
    /// The name of the connection.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// The hostname or IP address of the database server.
    /// </summary>
    public string HostName { get; set; }

    /// <summary>
    /// The TCP Port to connect to the database on.
    /// </summary>
    public int? Port { get; set; }

    /// <summary>
    /// The default database to connect to.
    /// </summary>
    public string Database { get; set; }

    /// <summary>
    /// The username to connect with.
    /// </summary>
    public string Username { get; set; }

    /// <summary>
    /// The password to connect with.
    /// </summary>
    public string Password { get; set; }
  }
}