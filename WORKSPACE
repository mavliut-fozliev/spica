workspace(
    name = "spica",
    managed_directories = {"@npm": ["node_modules"]},
)

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

# Setup nodejs workspace
http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "f9e7b9f42ae202cc2d2ce6d698ccb49a9f7f7ea572a78fd451696d03ef2ee116",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/1.6.0/rules_nodejs-1.6.0.tar.gz"],
)

load("@build_bazel_rules_nodejs//:index.bzl", "check_bazel_version", "node_repositories", "yarn_install")

check_bazel_version("0.27.0")

node_repositories()

yarn_install(
    name = "npm",
    always_hide_bazel_files = True,
    manual_build_file_contents = """
filegroup(
    name = "function_runtime_node_dependencies",
    srcs = [
        "//grpc:grpc__contents",
        "//grpc:grpc__nested_node_modules",
        # Rest are the dependencies of grpc flattened by package manager.
        "//@types/bytebuffer:bytebuffer__files",
        "//@types/long:long__files",
        "//@types/node:node__files",
        "//lodash.camelcase:lodash.camelcase__files",
        "//lodash.clone:lodash.clone__files",
        "//nan:nan__files",
        "//ascli:ascli__files",
        "//colour:colour__files",
        "//optjs:optjs__files",
        "//bytebuffer:bytebuffer__files",
        "//yargs:yargs__files",
        "//string-width:string-width__files",
        "//code-point-at:code-point-at__files",
        "//number-is-nan:number-is-nan__files",
        "//strip-ansi:strip-ansi__files",
        "//ansi-regex:ansi-regex__files",
        "//wrap-ansi:wrap-ansi__files",
        "//decamelize:decamelize__files",
        "//window-size:window-size__files",
    ]
)
    """,
    package_json = "//:package.json",
    yarn_lock = "//:yarn.lock",
)

# Install all Bazel dependencies needed for npm packages
load("@npm//:install_bazel_dependencies.bzl", "install_bazel_dependencies")

install_bazel_dependencies()

# Setup typescript workspace
load("@npm_bazel_typescript//:index.bzl", "ts_setup_workspace")

ts_setup_workspace()

# Setup docker workspace
git_repository(
    name = "io_bazel_rules_docker",
    commit = "363e12da417e6fa9dd447af5411b14489ea37ac4",
    remote = "https://github.com/bazelbuild/rules_docker.git",
    shallow_since = "1581544764 -0500",
)

# Load container repositories
load(
    "@io_bazel_rules_docker//repositories:repositories.bzl",
    container_repositories = "repositories",
)

container_repositories()

# Download base images, etc
load("@io_bazel_rules_docker//container:container.bzl", "container_pull")

container_pull(
    name = "nginx_image",
    digest = "sha256:881169baf03885268b54eb07c673bc27f394b263cb728dfd86ff2b65b3450932",
    registry = "index.docker.io",
    repository = "library/nginx",
    tag = "alpine",
)

container_pull(
    name = "debian_image",
    digest = "sha256:1ceec96ca567c40500a2745728f7c19c0801785c8b10187b1d66bcd538694fc2",
    registry = "index.docker.io",
    repository = "library/debian",
    tag = "buster-slim",
)

load(
    "@io_bazel_rules_docker//nodejs:image.bzl",
    nodejs_image_repos = "repositories",
)

nodejs_image_repos()

# Prepare base image for mongoreplicationcontroller
load("@io_bazel_rules_docker//contrib:dockerfile_build.bzl", "dockerfile_image")

dockerfile_image(
    name = "mongoreplicationcontroller_base",
    dockerfile = "//tools/mongoreplicationcontroller:Dockerfile",
)

# Setup kubernetes workspace
git_repository(
    name = "io_bazel_rules_k8s",
    commit = "26b1b471b4c2af39c4e2fedb2b25a3940b531a99",
    remote = "https://github.com/bazelbuild/rules_k8s.git",
    shallow_since = "1581367747 -0500",
)

load("@io_bazel_rules_k8s//k8s:k8s.bzl", "k8s_defaults", "k8s_repositories")

k8s_repositories()

# Create a rule named as k8s_deploy

k8s_defaults(
    name = "k8s_deploy",
    cluster = "_".join([
        "gke",
        "spica-239113",
        "us-central1-a",
        "godfather",  # Change to "ssl-cluster", to deploy prod.
    ]),
    image_chroot = "index.docker.io",
    kind = "deployment",
)

# Setup proto workspace
http_archive(
    name = "rules_proto",
    sha256 = "602e7161d9195e50246177e7c55b2f39950a9cf7366f74ed5f22fd45750cd208",
    strip_prefix = "rules_proto-97d8af4dc474595af3900dd85cb3a29ad28cc313",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_proto/archive/97d8af4dc474595af3900dd85cb3a29ad28cc313.tar.gz",
        "https://github.com/bazelbuild/rules_proto/archive/97d8af4dc474595af3900dd85cb3a29ad28cc313.tar.gz",
    ],
)

load("@rules_proto//proto:repositories.bzl", "rules_proto_dependencies", "rules_proto_toolchains")

rules_proto_dependencies()

rules_proto_toolchains()
