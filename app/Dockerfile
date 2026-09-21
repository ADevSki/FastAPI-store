FROM python:3.13-alpine

ENV HOME =/home/fast \
    APP_HOME=/home/fast/app \
    PYTHONPATH="$PYTHONPATH:/home/fast" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN mkdir -p $APP_HOME \
  && addgroup -S fast \
  && adduser -S fast -G fast

WORKDIR $HOME

COPY app app
COPY media media
COPY requirements.txt alembic.ini .

# обновление pip
# установка зависимостей из списка requirements.txt
# изменение владельца, для всех директорий и файлов проекта, на пользователя fast
RUN pip install --upgrade pip \
 && pip install -r requirements.txt \
 && chown -R fast:fast .

# изменение рабочего пользователя на fast
USER fast
