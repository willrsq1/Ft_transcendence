#!/bin/bash
envsubst < /etc/prometheus/prometheus.template.yml > /etc/prometheus/prometheus.yml
prometheus --config.file=/etc/prometheus/prometheus.yml
