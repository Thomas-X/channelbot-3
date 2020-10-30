# Channelbot 3
Channelbot is dead, long live Channelbot!
# Why ChannelBot?
## Major advantages
* ChannelBot is fast. Like really fast. Faster than a human can ever be. It gets a notification directly from Google the second you upload a video to your channel. This is probably the best argument.
* No programming knowledge needed.
* You send the bot 1 message and you're done.
## Minor advantages
* In combination with automoderator, you can give ChannelBot's submissions automatic flair (with something like 'official' or something)
* Because you know for sure that ChannelBot's submissions are official.
* It's easier to check for double submissions, i.e.: if someone's posting a video and it isn't ChannelBot, you know you can remove it without having to check if this is 'the only submission of this video'.
* If you're the one posting submissions, then this will probably save you lots of time as you don't have to check (and post) manually anymore.

# Development

- `cp .env.dist .env`
- `npm start`

# Production

## Docker
Docker usage is recommended, it will save you the hassle of having to set up redis and mysql.

- `cp .env.dist .env`
- Enter values for the `HUB_`, `YOUTUBE_` and `REDDIT_` fields.
  You can keep the `MYSQL_` and `REDIS_` fields to their defaults (if you wish).
  MySQL will run in it's own secluded network so setting the password won't matter that much.
- `docker-compose up -d`
- `docker-compose exec node ./deploy.sh`
  Execute this every time the sourcecode changes.

## Not docker

- Setup redis, mysql
- `cp .env.dist .env`
- Enter values.
- `npm run deploy`