using System;
using System.Collections.Generic;
using Autofac;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using CequelSpace.Api.Services.Connections;
using CequelSpace.Api.Services.Connections.Redis;
using CequelSpace.Api.Services.ConnectionTest;
using CequelSpace.Api.Services.Sql;
using System.Reflection;
using System.IO;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using StackExchange.Redis;

namespace CequelSpace.Api
{
    internal class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            //var redisConfigSection = Configuration.GetSection(RedisOptions.Section);
            //var endPoint = redisConfigSection.GetValue<string>("EndPoint");
            //using var connection = ConnectionMultiplexer.Connect(endPoint);

            services.AddOpenTelemetryTracing(
                (builder) => builder
                    .AddAspNetCoreInstrumentation()
                    .AddSqlClientInstrumentation()
                    //.AddRedisInstrumentation(connecti)
                    .SetResourceBuilder(ResourceBuilder.CreateDefault()
                        .AddService("Cequel.Space API", Environment.MachineName))
                    .AddJaegerExporter()
                    .AddConsoleExporter()
                    );

            var oauthSection = Configuration.GetSection("OAuth");
            var authority = oauthSection.GetValue<string>("Authority");
            var authorizationUrl = oauthSection.GetValue<string>("AuthorizationUrl");
            var tokenUrl = oauthSection.GetValue<string>("TokenUrl");
            var audience = oauthSection.GetValue<string>("ClientId");
            
            services.AddControllers();

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                }).AddJwtBearer(options => {
                    options.RequireHttpsMetadata = false;
                    options.SaveToken = true;
                    options.Authority = authority;
                    options.Audience = audience;
                });

            // Register the Swagger generator, defining 1 or more Swagger documents
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "Cequel.Space API", Version = "v1" });

                // Set the comments path for the Swagger JSON and UI.
                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                options.IncludeXmlComments(xmlPath);

                options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.OAuth2,
                    Flows = new OpenApiOAuthFlows
                    {
                        AuthorizationCode = new OpenApiOAuthFlow
                        {
                            AuthorizationUrl = new Uri(authorizationUrl),
                            TokenUrl = new Uri(tokenUrl),
                            
                            Scopes = new Dictionary<string, string>
                            {
                                {"openid", "Cequel.Space API - full access"}
                            }
                        }
                    }
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement{
                    {
                        new OpenApiSecurityScheme {
                            Reference = new OpenApiReference{ Type = ReferenceType.SecurityScheme, Id = "oauth2" }
                        },
                        new[] { "openid" }
                    }
                });
            });

            // Redis
            services.Configure<RedisOptions>(Configuration.GetSection(RedisOptions.Section));
        }

        // ConfigureContainer is where you can register things directly
        // with Autofac. This runs after ConfigureServices so the things
        // here will override registrations made in ConfigureServices.
        // Don't build the container; that gets done for you. If you
        // need a reference to the container, you need to use the
        // "Without ConfigureContainer" mechanism shown later.
        public void ConfigureContainer(ContainerBuilder builder)
        {
            //builder.RegisterType<ConnectionsService>().As<IConnectionsService>().SingleInstance();
            builder.RegisterType<ConnectionTestService>().As<IConnectionTestService>().SingleInstance();
            builder.RegisterType<SqlService>().As<ISqlService>().SingleInstance();

            builder.RegisterType<RedisService>().As<IConnectionsService>().SingleInstance();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            var oauthSection = Configuration.GetSection("OAuth");
            var clientId = oauthSection.GetValue<string>("ClientId");
            var audience = oauthSection.GetValue<string>("Audience");

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            //app.UseHttpsRedirection();
            
            // Enable middleware to serve generated Swagger as a JSON endpoint.
            app.UseSwagger();

            // Enable middleware to serve swagger-ui (HTML, JS, CSS, etc.), 
            // specifying the Swagger JSON endpoint.
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Cequel.Space API V1");
                c.OAuthClientId(clientId);
                c.OAuthAppName(audience);
                c.OAuthUsePkce();
                c.OAuthAdditionalQueryStringParams(new Dictionary<string, string>{{"audience", audience}});
            });

            app.UseRouting();

            app.UseAuthentication();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
