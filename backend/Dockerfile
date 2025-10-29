FROM archlinux:latest
RUN pacman -Sy --noconfirm \
    base-devel \
    postgresql-libs \
    libmicrohttpd \
    && pacman -Scc --noconfirm 
WORKDIR /usr/src/app
COPY main.c .
RUN gcc -o backend main.c -lmicrohttpd -lpq
EXPOSE 8080
CMD ["./backend"]