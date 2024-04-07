envsubst < custom_grafana.ini.template > /etc/grafana/grafana.ini

exec /run.sh "$@"
