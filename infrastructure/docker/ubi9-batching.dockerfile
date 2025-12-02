#  Base image
FROM registry.redhat.io/ubi9/ubi
# Maintainer
LABEL maintainer="dang"
# ENV
ENV MONGODB_USER=ingestion
ENV MONGODB_PASSWD=Fin71510
ENV PORT=5000
ENV NODE_ENV=production
ENV BACKEND_PUBLIC_URL=http://localhost:5000/
ENV MONGODBHOST=cluster0.qsa9hsq.mongodb.net
 ## MongoDB port (default is 27017)
ENV  MONGODB_CONNECTING_port=27017
ENV  MONGODBDATABASE=hotel_info
ENV  authSource=admin
ENV  useUnifiedTopology=true

EXPOSE 5000
# Set working dir
WORKDIR /opt
# Copy/packaging your code *left side your is the project-folder, right-side where to save on the container
C
