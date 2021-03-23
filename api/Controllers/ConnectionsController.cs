using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using CequelSpace.Api.Models;
using CequelSpace.Api.Services.Connections;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace CequelSpace.Api.Controllers {

    /// <summary>
    ///
    /// </summary>    
    [Authorize]
    [ApiController]
    [Route("/api/v1/[controller]")]
    public class ConnectionsController : ControllerBase {

        private readonly ILogger<ConnectionsController> _logger;

        private readonly IConnectionsService _connectionsService;

        /// <summary>
        /// Initialises a new instance of the Connections Controller
        /// </summary>
        public ConnectionsController(IConnectionsService connectionsService, ILogger<ConnectionsController> logger)
        {
            _connectionsService = connectionsService;
            _logger = logger;
        }

        /// <summary>
        /// Gets the connections
        /// </summary>
        /// <returns></returns>
        [HttpGet()]
        [ProducesResponseType(typeof(IEnumerable<Connection>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]    
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<Connection>>> GetAll()
        {
            try {
                var userId =  User.FindFirstValue(ClaimTypes.NameIdentifier);

                return Ok(await _connectionsService.GetAll(userId));
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Add a connection
        /// </summary>
        /// <param name="connection">The connection to add.</param>
        /// <returns>Accepted result</returns>
        [HttpPost]
        [ProducesResponseType(typeof(string), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        [Produces("application/json")]
        public async Task<ActionResult<Guid>> Add([Required] Connection connection) {
            try {
                if (connection == null) {
                    return new BadRequestResult();
                }

                if (connection.ID != Guid.Empty) {
                    return new BadRequestResult();
                }

                var userId =  User.FindFirstValue(ClaimTypes.NameIdentifier);

                var id = await _connectionsService.Add(userId, connection);

                return Created($"api/v1/Connections/{id.ToString()}", id);
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Update a connection
        /// </summary>
        /// <param name="connection">The connection to update.</param>
        /// <returns>Accepted result</returns>
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        [Produces("application/json")]
        public async Task<ActionResult> Update([Required] Connection connection) {
            try {
                if (connection == null) {
                    return new BadRequestResult();
                }

                if (Guid.Empty == connection.ID) {
                    return new BadRequestResult();
                }

                var userId =  User.FindFirstValue(ClaimTypes.NameIdentifier);

                await _connectionsService.Update(userId, connection);

                return Ok();
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Request cancellation of query execution
        /// </summary>
        /// <param name="id">The ID of the request to cancel.</param>
        /// <returns></returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> Delete([Required] Guid id) {
            try
            {
                var userId =  User.FindFirstValue(ClaimTypes.NameIdentifier);

                await _connectionsService.Delete(userId, id);

                return Ok();
            } catch (Exception e) {
                return Problem(e.Message, null, StatusCodes.Status500InternalServerError);
            }
        }
    }
}
