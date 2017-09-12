BUILD = index.html

test.zip: $(BUILD)
	zip $@ $^
	@ls -l $@
	@echo "$$(( 10000000 / 13312 * $$(stat -f '%z' $@) / 100000 ))%"
	@rm -f $@

$(BUILD): src.js preview.html
	bash squeeze.sh > $(BUILD)

clean:
	rm -f $(BUILD) gfx/*.obj gfx/*.mtl

up: $(BUILD)
	scp $(BUILD) hhsw.de@ssh.strato.de:sites/proto/js13k2017/
