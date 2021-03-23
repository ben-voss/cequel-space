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
using CequelSpace.Api.Services.ConnectionTest;

namespace CequelSpace.Api.Controllers {
    
    /// <summary>
    ///
    /// </summary>
    [ApiController]
    [Route("/api/v1/[controller]")]
    public class ConnectionTestController : ControllerBase {

        private readonly ILogger<ConnectionTestController> _logger;

        private readonly IConnectionTestService _connectionTestService;

        /// <summary>
        /// Initialises a new instance of the Connection Test Controller
        /// </summary>
        public ConnectionTestController(IConnectionTestService connectionTestService, ILogger<ConnectionTestController> logger)
        {
            _connectionTestService = connectionTestService;
            _logger = logger;
        }

        /// <summary>
        /// Run a test
        /// </summary>
        /// <param name="connection">The connection to test.</param>
        /// <returns>Accepted result</returns>
        [HttpPost]
        [ProducesResponseType(typeof(string), StatusCodes.Status202Accepted)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        [Produces("application/json")]
        public IActionResult Run([Required] Connection connection) {
            try {
                // Begin the test.
                var id = _connectionTestService.Start(connection);

                // Return the location to call to get the result
                return Accepted($"api/v1/Sql/{id.ToString()}", id);
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Request cancellation of a connection test.
        /// </summary>
        /// <param name="id">The ID of the test to cancel.</param>
        /// <returns></returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public IActionResult Cancel([Required] Guid id) {
            try
            {
                _connectionTestService.Cancel(id);

                return Ok();
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Gets the result of a connection test.
        /// </summary>
        /// <param name="id">The ID of the connection test to return.</param>
        /// <returns></returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]    
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<RecordSet>>> GetResult(Guid id)
        {
            try {
                var result = _connectionTestService.GetResult(id);

                if (result == null) {
                    return NotFound();
                }

                return Ok(await result);
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }
    }
}
