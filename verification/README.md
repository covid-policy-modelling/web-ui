# Introduction

Scripts to verify web-ui scripts.
All scripts expect to be executed when there is a running web container, and from the root of the project (i.e. in the directory containing `docker-compose.yml`).

## verify-cached-data-dry-run.sh

This will use cached downloads, and check what data has been parsed.
Note that if the external websites were updated, this wouldn't catch the issue - you'll need to use other scripts for that.

To update the cached downloads, run the `verify-live-data-dry-run.sh`.
Assuming it's worked correctly, then run `cp verification/verify-live-data-dry-run/cached/* verification/verify-cached-data-dry-run/cache`

## verify-cached-data.sh

This will fetch data from the live websites, and check what data has been inserted into the database.
Note that if the external websites were updated, this wouldn't catch the issue - you'll need to use other scripts for that.

To update the cached downloads, run the `verify-live-data-dry-run.sh`.
Assuming it's worked correctly, then run `cp verification/verify-live-data-dry-run/cached/* verification/verify-cached-data/cache`

## verify-live-data-dry-run.sh

This will fetch data from the live websites, and check what data has been downloaded.
Note that since this actually uses the external websites, it will usually fail as the data is updated, and should be checked manually (and the files updated).
It may also fail intermittently.

## verify-live-data.sh

This will fetch data from the live websites, and check what data has been inserted into the database.
Note that since this actually uses the external websites, it will usually fail as the data is updated, and should be checked manually (and the files updated).
It may also fail intermittently.
