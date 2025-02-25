pipeline {
    agent any

    environment {
        // Docker Hub credentials (stored in Jenkins)
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        // Docker repository name 
        DOCKER_REPO = "guyhagever/my-booksearch-app"
        CURRENT_VERSION = "1.0.0"

        // Kubernetes deployment details for microk8s
        DEPLOYMENT_NAME = "book-search-app-deployment"
        CONTAINER_NAME = "book-search-app-container"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/guyhagever/devops-eks-project.git'
            }
        }

        stage('Increment Version') {
            steps {
                script {
                    // If a VERSION.txt file exists, use it as the current version
                    if (fileExists('VERSION.txt')) {
                        env.CURRENT_VERSION = readFile('VERSION.txt').trim()
                    }
                    def splitted = env.CURRENT_VERSION.tokenize('.')
                    int major = splitted[0].toInteger()
                    int minor = splitted[1].toInteger()
                    int patch = splitted[2].toInteger() + 1
                    def newVersion = "${major}.${minor}.${patch}"
                    echo "Old version: ${env.CURRENT_VERSION}"
                    echo "New version: ${newVersion}"
                    env.NEW_VERSION = newVersion
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def versionTag = env.NEW_VERSION ?: env.CURRENT_VERSION
                    echo "Building Docker image: ${DOCKER_REPO}:${versionTag}"
                    sh "docker build -t ${DOCKER_REPO}:${versionTag} ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    def versionTag = env.NEW_VERSION ?: env.CURRENT_VERSION
                    echo "Pushing Docker image: ${DOCKER_REPO}:${versionTag}"
                    sh """
                        docker login -u ${DOCKERHUB_CREDENTIALS_USR} -p ${DOCKERHUB_CREDENTIALS_PSW}
                        docker push ${DOCKER_REPO}:${versionTag}
                    """
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    def versionTag = env.NEW_VERSION ?: env.CURRENT_VERSION
                    echo "Running tests for Docker image: ${DOCKER_REPO}:${versionTag}"
                    // Run npm test inside the container
                    sh "docker run --rm ${DOCKER_REPO}:${versionTag} npm test"
            
                    // Check if test report files exist before trying to archive them
                    def testReports = findFiles(glob: 'test-results/*.xml')
                    if (testReports.length > 0) {
                        junit 'test-results/*.xml'
                    } else {
                        echo "No test reports found. Skipping junit step."
                    }
                }
            }
        }



        stage('Deploy to Kubernetes (microk8s)') {
            steps {
                script {
                    def versionTag = env.NEW_VERSION ?: env.CURRENT_VERSION
                    echo "Deploying Docker image: ${DOCKER_REPO}:${versionTag} to microk8s"
                    // Deploy the manifest using microk8s kubectl
                    sh "microk8s kubectl apply -f k8s/deployment.yaml"
                    
                    // Update the container image in the deployment and wait for a successful rollout
                    sh """
                        microk8s kubectl set image deployment/${DEPLOYMENT_NAME} ${CONTAINER_NAME}=${DOCKER_REPO}:${versionTag} --record
                        microk8s kubectl rollout status deployment/${DEPLOYMENT_NAME}
                    """
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up workspace..."
            cleanWs()
        }
        success {
            echo "Pipeline finished successfully."
        }
        failure {
            echo "Pipeline failed."
        }
    }
}
