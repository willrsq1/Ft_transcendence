FROM alpine:3.19.1

RUN apk add --no-cache curl gettext

RUN curl -LO https://github.com/prometheus/prometheus/releases/download/v2.49.0/prometheus-2.49.0.linux-amd64.tar.gz \
    && tar -xvzf prometheus-2.49.0.linux-amd64.tar.gz \
    && mv prometheus-2.49.0.linux-amd64/prometheus /usr/local/bin/ \
    && mv prometheus-2.49.0.linux-amd64/promtool /usr/local/bin/ \
    && mkdir /etc/prometheus \
    && mv prometheus-2.49.0.linux-amd64/consoles /etc/prometheus \
    && mv prometheus-2.49.0.linux-amd64/console_libraries /etc/prometheus \
    && rm -rf prometheus-2.49.0.linux-amd64.tar.gz prometheus-2.49.0.linux-amd64

COPY script.sh /etc/prometheus/script.sh
RUN chmod +x /etc/prometheus/script.sh
EXPOSE 9090


ENTRYPOINT ["sh", "/etc/prometheus/script.sh"]
