using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using CequelSpace.Api.Services.Sql;
using CequelSpace.Api.Models;
using CequelSpace.Api.Services.Connections;
using Microsoft.Net.Http.Headers;
using System.Text.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace CequelSpace.Api.Controllers {
    
    /// <summary>
    ///
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("/api/v1/[controller]")]
    public class SqlController : ControllerBase {

        private readonly ILogger<SqlController> _logger;

        private readonly ISqlService _sqlService;

        private readonly IConnectionsService _connectionsService;

        /// <summary>
        /// Initialises a new instance of the SQL Controller
        /// </summary>
        public SqlController(ISqlService sqlService, IConnectionsService connectionsService, ILogger<SqlController> logger)
        {
            _sqlService = sqlService;
            _connectionsService = connectionsService;
            _logger = logger;
        }

        /// <summary>
        /// Post a query to execute.
        /// </summary>
        /// <param name="query">The SQL query to execute.</param>
        /// <returns>Accepted result</returns>
        [HttpPost]
        [ProducesResponseType(typeof(string), StatusCodes.Status202Accepted)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        [Produces("application/json")]
        public async Task<IActionResult> Run([Required] BatchJob query) {
            try {
                if (query.ConnectionId == Guid.Empty) {
                    return new BadRequestResult();
                }

                if (String.IsNullOrEmpty(query.Query)) {
                    return new BadRequestResult();
                }

                var userId =  User.FindFirstValue(ClaimTypes.NameIdentifier);

                var connection = await _connectionsService.GetById(userId, query.ConnectionId);

                if (connection == null) {
                    return new BadRequestResult();
                }

                // Begin the query.
                var requestId = _sqlService.StartQuery(userId, connection, query.Query);

                // Return the location to call to get the result
                return Accepted($"api/v1/Sql/{requestId.ToString()}", requestId);
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Request cancellation of query execution
        /// </summary>
        /// <param name="requestId">The ID of the request to cancel.</param>
        /// <returns></returns>
        [HttpDelete("{requestId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public IActionResult Cancel([Required] Guid requestId) {
            try
            {
                var userId =  User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                _sqlService.CancelQuery(userId, requestId);

                return Ok();
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Gets the result of a query.
        /// </summary>
        /// <param name="requestId">The ID of the request to return.</param>
        /// <returns></returns>
        [HttpGet("{requestId}")]
        [ProducesResponseType(typeof(IEnumerable<RecordSet>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]    
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [Produces("application/json")]
        public async Task GetStreamedResult(Guid requestId)
        {
            var userId =  User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            JsonSerializerOptions options = new JsonSerializerOptions()
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            this.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            var outputStream = this.Response.Body;
            
            var recordSets = _sqlService.GetResult(userId, requestId);

            if (recordSets == null) {
                this.Response.StatusCode = StatusCodes.Status404NotFound;
                
                await JsonSerializer.SerializeAsync(outputStream,
                    ProblemDetailsFactory.CreateProblemDetails(this.HttpContext, StatusCodes.Status404NotFound), options);
            } else {
                this.Response.StatusCode = 200;

                await outputStream.WriteAsync(new byte[]{(byte)'['}, 0, 1);

                bool first = true;
                await foreach (var recordSet in recordSets) {
                    if (!first) {
                        await outputStream.WriteAsync(new byte[]{(byte)','}, 0, 1);
                    } else {
                        first = false;
                    }

                    await JsonSerializer.SerializeAsync(outputStream, recordSet, options);
                    await outputStream.FlushAsync();
                }

                await outputStream.WriteAsync(new byte[]{(byte)']'}, 0, 1);
            }

            await outputStream.FlushAsync();
        }
    }
}
