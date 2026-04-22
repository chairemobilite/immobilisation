# ---- Base ----
FROM node:20

# ---- System dependencies ----
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Conda ----
ENV CONDA_DIR=/opt/conda
ENV PATH=$CONDA_DIR/bin:$PATH

RUN wget -q https://repo.anaconda.com/miniconda/Miniconda3-py312_25.11.1-1-Linux-x86_64.sh -O /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -p $CONDA_DIR && \
    rm /tmp/miniconda.sh

SHELL ["/bin/bash", "-c"]

# ---- Conda config ----
RUN conda config --add channels conda-forge && \
    conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main && \
    conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r

# ---- Create Conda env (cacheable) ----
WORKDIR /app/serveur_calcul_python
COPY serveur_calcul_python/environment.yml .
RUN --mount=type=cache,target=/opt/conda/pkgs \
    conda env create -f environment.yml
#  ----------- Instann node stuff -------------
WORKDIR /app/serveur
COPY serveur/package*.json ./
RUN npm install -g npm@11.0.0
RUN npm install

COPY serveur/tsconfig.json ./

COPY serveur ./
WORKDIR /app
COPY serveur_calcul_python ./serveur_calcul_python

# Return to /app/serveur
WORKDIR /app/serveur

# RUN npm run build
EXPOSE 5000 9229 5678

CMD ["npm", "run", "dev"]
