#!/bin/sh

cat <<EOT >> /usr/share/nginx/html/config.json
{
    "authority": "${OAuth__Authority}",
    "clientId": "${OAuth__ClientId}",
    "responseType": "${OAuth__ResponseType}"
}
EOT
