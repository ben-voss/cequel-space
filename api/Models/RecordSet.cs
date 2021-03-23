namespace CequelSpace.Api.Models {
  
  /// <summary>
  /// Result of running a query
  /// </summary>
  public class RecordSet {
    /// <summary>
    /// Messages
    /// </summary>
    public string Message { get; set; }

    /// <summary>
    /// Header
    /// </summary>
    public string[] Headers { get; set;}

    /// <summary>
    /// Data
    /// </summary>
    public object[][] Data { get; set;}
  }
}