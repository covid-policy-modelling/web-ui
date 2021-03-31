#!/bin/bash

CACHE=$(docker-compose exec web mktemp -d)
CACHE=${CACHE%$'\r'}
DATA_DIR=verification/verify-live-data-dry-run

docker-compose exec web script/fetch-recorded-data --dry-run --cache-dir $CACHE

docker-compose exec web cat $CACHE/case-data.json > $DATA_DIR/cases.actual.json
diff -q $DATA_DIR/cases.expected.json $DATA_DIR/cases.actual.json

docker-compose exec web cat $CACHE/intervention-data.json > $DATA_DIR/interventions.actual.json
diff -q $DATA_DIR/interventions.expected.json $DATA_DIR/interventions.actual.json
