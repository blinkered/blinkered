{{- define "blinkered.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "blinkered.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := include "blinkered.name" . -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "blinkered.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "blinkered.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "blinkered.web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "blinkered.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: web
{{- end -}}

{{- define "blinkered.api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "blinkered.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: api
{{- end -}}

{{- define "blinkered.postgres.selectorLabels" -}}
app.kubernetes.io/name: {{ include "blinkered.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: postgres
{{- end -}}

{{/*
Which secret the API reads its database keys from.

One name whether the database is the chart's StatefulSet or somebody else's managed Postgres,
which is the whole point: the API's environment is identical either way, so there is no code path
that only runs in one of the two arrangements.
*/}}
{{- define "blinkered.databaseSecret" -}}
{{- if .Values.postgres.existingSecret -}}
{{- .Values.postgres.existingSecret -}}
{{- else -}}
{{- printf "%s-database" (include "blinkered.fullname" .) -}}
{{- end -}}
{{- end -}}

{{- define "blinkered.postgres.fullname" -}}
{{- printf "%s-postgres" (include "blinkered.fullname" .) -}}
{{- end -}}

{{/*
The database password, preserved across upgrades.

`lookup` reads the secret that is already in the cluster, so a generated password survives a
`helm upgrade` instead of being rolled and locking the API out of its own database. It returns
nothing during `helm template` and `--dry-run`, which is why a rendered manifest shows a
different password than the cluster holds; that is the function working, not a bug.
*/}}
{{- define "blinkered.postgres.password" -}}
{{- if .Values.postgres.auth.password -}}
{{- .Values.postgres.auth.password -}}
{{- else -}}
{{- $existing := lookup "v1" "Secret" .Release.Namespace (include "blinkered.databaseSecret" .) -}}
{{- if and $existing $existing.data.password -}}
{{- index $existing.data "password" | b64dec -}}
{{- else -}}
{{- randAlphaNum 32 -}}
{{- end -}}
{{- end -}}
{{- end -}}
