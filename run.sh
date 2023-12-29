while [ true ] ; do
    node --no-warnings dist/

    if [ $? -eq 0 ] ; then
        break
    fi

    sleep 1
done
