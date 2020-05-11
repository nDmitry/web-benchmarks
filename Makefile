include .makerc
export

all: db-create db-init
.PHONY: all

db-create:
	docker run --name $(PG_CONTAINER) \
	-d \
	-e POSTGRES_PASSWORD=$(PG_PASS) \
	-p $(PG_PORT):5432 \
	postgres:$(PG_VERSION)-alpine

db-init:
	sleep 1
	docker exec -u $(PG_USER) $(PG_CONTAINER) createdb $(PG_DB)
	cat $(USERS_SQL_PATH) | docker exec -i -u $(PG_USER) $(PG_CONTAINER) \
	bash -c 'psql -d $(PG_DB) -w -a -q -f -'

db-start:
	docker start $(PG_CONTAINER)

db-stop:
	docker stop $(PG_CONTAINER)

db-clear:
	docker rm -f -v $(PG_CONTAINER)
