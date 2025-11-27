APP_NAME = foxxeeye
IMAGE = foxxeeye:latest

build:
	docker build -t $(IMAGE) .

run:
	docker run -p 8000:8000 --name $(APP_NAME) $(IMAGE)

stop:
	docker stop $(APP_NAME) || true
	docker rm $(APP_NAME) || true

logs:
	docker logs -f $(APP_NAME)

compose:
	docker compose up --build -d

down:
	docker compose down

clean:
	docker system prune -af

restart:
	make down && make compose

