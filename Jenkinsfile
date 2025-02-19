pipeline {
    agent any

    environment {
        // Docker Hub credentials (stored in Jenkins)
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')  
        // Docker repository name 
        DOCKER_REPO = "guyhagever/my-booksearch-app"
        CURRENT_VERSION = "1.0.0"

        // AWS/EKS info
        AWS_REGION = "il-central-1"
        CLUSTER_NAME = "my-eks-cluster"

        // K8s deployment details
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
                    // If a VERSION file exists, read it
                    if (fileExists('VERSION.txt')) {
                        env.CURRENT_VERSION = readFile('VERSION.txt').trim()
                    }

                    // Parse e.g. "1.0.0" -> [1, 0, 0]
                    def (major, minor, patch) = env.CURRENT_VERSION.tokenize('.')*.toInteger()
                    // Increment patch by 1
                    patch = patch + 1
                    def newVersion = "${major}.${minor}.${patch}"

                    echo "Old version: ${env.CURRENT_VERSION}"
                    echo "New version: ${newVersion}"
                    
                    // We'll store new version in an env var
                    env.NEW_VERSION = newVersion
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def versionTag = env.NEW_VERSION ?: env.CURRENT_VERSION
                    
                    sh """
                      echo "Building Docker image: ${DOCKER_REPO}:${versionTag}"
                      docker build -t ${DOCKER_REPO}:${versionTag} .
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    def versionTag = env.NEW_VERSION ?: env.CURRENT_VERSION

                    // Docker login to Docker Hub
                    sh """
                      docker login -u ${DOCKERHUB_CREDENTIALS_USR} -p ${DOCKERHUB_CREDENTIALS_PSW}
                      docker push ${DOCKER_REPO}:${versionTag}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    def versionTag = env.NEW_VERSION ?: env.CURRENT_VERSION

                    // Update local kubeconfig for EKS
                    sh """
                      aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}
                    """

                    // Update the Deployment's container image
                    sh """
                      kubectl set image deployment/${DEPLOYMENT_NAME} ${CONTAINER_NAME}=${DOCKER_REPO}:${versionTag} --record
                      kubectl rollout status deployment/${DEPLOYMENT_NAME}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline finished successfully."

            // Optional: If you want to write back the new version to the VERSION file, commit and push
            // script {
            //     writeFile file: 'VERSION', text: env.NEW_VERSION
            //     sh """
            //       git config user.email "jenkins@mycompany.com"
            //       git config user.name "Jenkins"
            //       git add VERSION
            //       git commit -m "Bump version to ${env.NEW_VERSION}"
            //       git push origin main
            //     """
            // }
        }
        failure {
            echo "Pipeline failed."
        }
    }
}
