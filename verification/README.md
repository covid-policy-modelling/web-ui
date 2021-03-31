# Introduction

Scripts to verify web-ui scripts
Note that these access the live data, and will write into your configured database.

## verify-live-data.sh

This will fetch data from the live websites, and check what data has been inserted into the database.
Note that since this actually uses the external websites, it will usually fail as the data is updated, and should be checked manually (and the files updated).
It may also fail intermittently.
