from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        messages = []

        if isinstance(errors, dict):
            for field, msgs in errors.items():
                if isinstance(msgs, list):
                    for msg in msgs:
                        messages.append(f"{field} - {msg}")
                else:
                    messages.append(f"{field} - {msgs}")
        elif isinstance(errors, list):
            # e.g., for non-field errors that return a list
            for msg in errors:
                messages.append(str(msg))
        else:
            messages.append(str(errors))

        return Response({"message": " | ".join(messages)}, status=response.status_code)

    return Response({"message": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
