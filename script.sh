#!/bin/bash

# user and password from `./manage.py createsuperuser`
YOUR_USER='matthieu'
YOUR_PASS='yourpassword'

BASE_URL=https://192.168.64.15:8443
LOGIN_URL=$BASE_URL/auth/login/
CREATE_GAME_URL=$BASE_URL/game/

COOKIES=cookies.txt

# stores csrftoken cookie on cookies.txt
curl -k -s -c $COOKIES $BASE_URL > /dev/null

TOKEN_VALUE="$(grep -oP '(?<=csrftoken[[:space:]]).*' cookies.txt)"

# logs in, updating csrftoken and adding sessionid cookies
LOGIN_RESPONSE=$(curl -k -b $COOKIES -c $COOKIES -d "csrfmiddlewaretoken=$TOKEN_VALUE&username=$YOUR_USER&password=$YOUR_PASS" $LOGIN_URL)

TOKEN_VALUE=$(echo "$LOGIN_RESPONSE" | awk -F'"' '{print $4}')

# updates var env with new cookie
TOKEN_VALUE="$(grep -oP '(?<=csrftoken[[:space:]]).*' cookies.txt)"

# here comes the real request
JSON_RESPONSE=$(curl -k -s -X POST -b $COOKIES -d "{\"a\":1}" -H "X-CSRFToken: $TOKEN_VALUE" $CREATE_GAME_URL)

# Extracting the value from the JSON response
ID_VALUE=$(echo "$JSON_RESPONSE" | sed -n 's/.*"id": "\(.*\)".*/\1/p')

EVENTSOURCE_URL=$BASE_URL/game/$ID_VALUE/?token=$TOKEN_VALUE

# curl -N -k -s -X GET -b $COOKIES -d "{\"a\":1}" -H "X-CSRFToken: $TOKEN_VALUE" $EVENTSOURCE_URL

curl -N -k -X GET -b $COOKIES -H "X-CSRFToken: $TOKEN_VALUE" $EVENTSOURCE_URL

# rm cookies.txt
