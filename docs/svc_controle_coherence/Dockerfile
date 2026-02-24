FROM python:3.12-alpine

# Update the package repository and upgrade all installed packages
RUN apk update && apk upgrade --available && apk add --no-cache git && rm -rf /var/cache/apk/*

RUN mkdir -p /usr/src/app/controle_coherence/
WORKDIR /usr/src/app/controle_coherence

# copy ressources from both modele_donnee and svc_controle_coherence
COPY svc_controle_coherence/app.py ./
COPY versions.yml ./
COPY svc_controle_coherence/setup.py ./
ADD svc_controle_coherence/static ./static
ADD svc_controle_coherence/controle_coherence ./controle_coherence
ADD /modele_donnee ./controle_coherence/modele_donnee
ADD svc_controle_coherence/test ./test

# install python dependencies
# be sure to work with the latest version of pip
RUN pip install --upgrade pip
COPY svc_controle_coherence/requirements.txt ./
RUN pip install -r requirements.txt
# install module
RUN python setup.py develop
# run app
RUN cat app.py
ENTRYPOINT ["python"]
CMD ["app.py"]




