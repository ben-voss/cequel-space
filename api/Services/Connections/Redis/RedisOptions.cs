namespace CequelSpace.Api.Services.Connections.Redis {

  internal class RedisOptions {

    public const string Section = "Redis";

    public string EndPoint { get; set; }
    public string Password { get; set; }
    public string Certificate { get; set; }
    public bool Ssl { get; set; }
    public int Database { get; set; }
  }
}