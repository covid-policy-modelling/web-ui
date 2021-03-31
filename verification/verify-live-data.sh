#!/bin/bash

DATA_DIR=verification/verify-live-data

docker-compose exec web script/fetch-recorded-data

docker-compose exec db sh -c 'mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "select id, region_id, subregion_id, date, confirmed, recovered, deaths from case_data"' > $DATA_DIR/cases.actual.out
diff -q $DATA_DIR/cases.expected.out $DATA_DIR/cases.actual.out

docker-compose exec db sh -c 'mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "select id, region_id, subregion_id, policy, notes, source, issue_date, start_date, ease_date, expiration_date, end_date from intervention_data"' > $DATA_DIR/interventions.actual.out
diff -q $DATA_DIR/interventions.expected.out $DATA_DIR/interventions.actual.out
