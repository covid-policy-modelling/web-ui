# Introduction

Scripts to verify web-ui scripts

## verify-cached-data-dry-run.sh

This will use cached downloads, and check what data has been parsed.
Note that if the external websites were updated, this wouldn't catch the issue - you'll need to use other scripts for that.

## verify-live-data-dry-run.sh

This will fetch data from the live websites, and check what data has been downloaded.
Note that since this actually uses the external websites, it will usually fail as the data is updated, and should be checked manually (and the files updated).
It may also fail intermittently.

## verify-live-data.sh

This will fetch data from the live websites, and check what data has been inserted into the database.
Note that since this actually uses the external websites, it will usually fail as the data is updated, and should be checked manually (and the files updated).
It may also fail intermittently.
